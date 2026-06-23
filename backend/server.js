const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

// --- SAFEGUARD 1: RECORDING_ENABLED kill-switch ---
// Set RECORDING_ENABLED=false in env to disable all write operations instantly
const RECORDING_ENABLED = (process.env.RECORDING_ENABLED ?? "false").toLowerCase() === "true";

// --- SAFEGUARD 2: MAX_TOTAL_RECORDS global cap ---
// Hard cap across ALL sessions/IPs — prevents runaway testnet drain
const MAX_TOTAL_RECORDS = parseInt(process.env.MAX_TOTAL_RECORDS || "25", 10);
let totalRecordCount = 0; // incremented on each successful recording

// --- SAFEGUARD 3: Single-flight mutex ---
// Only one on-chain transaction can be in-flight at a time
let recordingInFlight = false;

// CORS restricted to Vercel frontend + localhost dev only (Finding 2 fix)
const CORS_ORIGINS = [
  "https://frontend-beige-zeta-86.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl) — these are gated by requireSecret
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"), false);
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Backend-Secret", "X-Session-Id"],
}));
app.use(express.json());

const SEED_PATH = path.join(__dirname, "seed-decisions.json");
const STORE_PATH = path.join(__dirname, "decisions-store.json");
const KEYS_DIR = path.join(__dirname, "..", "keys");
const CONTRACT_PACKAGE = "hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb";
const NODE_URL = "https://node.testnet.casper.network/rpc";
const CHAIN_NAME = "casper-test";
const BACKEND_SECRET = process.env.BACKEND_SECRET;
if (!BACKEND_SECRET) {
  console.error("FATAL: BACKEND_SECRET env var is required. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  process.exit(1);
}

// Middleware: validate backend secret on write endpoints (FAIL-CLOSED)
// No localhost bypass — secret required in all environments (Finding 5 fix)
function requireSecret(req, res, next) {
  const secret = req.headers["x-backend-secret"];
  if (!secret) {
    return res.status(401).json({ error: "Unauthorized", detail: "Valid X-Backend-Secret header required" });
  }
  // Constant-time comparison — pad to equal length to avoid timingSafeEqual throwing
  const a = Buffer.from(secret);
  const b = Buffer.from(BACKEND_SECRET);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized", detail: "Valid X-Backend-Secret header required" });
}

// Load decisions from store (or seed if store doesn't exist)
let decisions = [];
if (fs.existsSync(STORE_PATH)) {
  decisions = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
} else if (fs.existsSync(SEED_PATH)) {
  decisions = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  fs.writeFileSync(STORE_PATH, JSON.stringify(decisions, null, 2));
}

function saveStore() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(decisions, null, 2));
}

// Global record count starts at 0 each server instance — "operator-resettable" per plan.
// Restart the server to reset the cap. Pre-existing seeded decisions don't count.
// Balance guard is the hard safety net; this cap is abuse prevention for a single run.
totalRecordCount = 0;

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function canonicalize(obj) {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

// --- Abuse Protection ---
// Rate limiter: max requests per IP per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 record calls per minute per IP
const rateLimitMap = new Map(); // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  if (process.env.TEST_MODE && process.env.NODE_ENV === "test") return next();
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - entry.count));
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      detail: `Max ${RATE_LIMIT_MAX} recordings per minute. Try again in ${Math.ceil((entry.resetAt - now) / 1000)}s.`,
      retryAfterMs: entry.resetAt - now,
    });
  }
  next();
}

// Per-session cap: max recordings per IP (NOT spoofable via headers)
// X-Session-Id is used for UX only — the actual cap key is IP-based
const SESSION_CAP = 5; // max 5 recordings per IP
const sessionCounts = new Map(); // ip -> count

function perSessionCap(req, res, next) {
  if (process.env.TEST_MODE && process.env.NODE_ENV === "test") return next();
  // Use IP as the session key — client-supplied X-Session-Id is informational only
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const count = sessionCounts.get(ip) || 0;
  if (count >= SESSION_CAP) {
    return res.status(429).json({
      error: "Session recording limit reached",
      detail: `Maximum ${SESSION_CAP} recordings per session to preserve testnet resources.`,
      sessionRecordings: count,
      sessionCap: SESSION_CAP,
    });
  }
  sessionCounts.set(ip, count + 1);
  res.setHeader("X-Session-Recordings", count + 1);
  res.setHeader("X-Session-Cap", SESSION_CAP);
  next();
}

// Key balance guard: check CSPR balance before recording
const MIN_BALANCE_MOTES = 50_000_000_000; // 50 CSPR minimum (each tx costs ~3 CSPR)
let cachedBalance = { motes: null, checkedAt: 0 };
const BALANCE_CACHE_MS = 60_000; // cache balance for 1 min

async function checkKeyBalance() {
  const now = Date.now();
  if (cachedBalance.motes !== null && (now - cachedBalance.checkedAt) < BALANCE_CACHE_MS) {
    return cachedBalance.motes;
  }
  try {
    // Read account hash from the public key PEM
    const pubKeyHex = execFileSync("casper-client", [
      "account-address", "--public-key", path.join(KEYS_DIR, "public_key.pem"),
    ], { timeout: 5000 }).toString().trim();

    // Validate pubKeyHex looks like a valid account hash
    if (!pubKeyHex || pubKeyHex.length < 20 || pubKeyHex.includes("{")) {
      throw new Error("Invalid account address output");
    }

    const rpcRes = await fetch(NODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "query_balance",
        params: { purse_identifier: { main_purse_under_account_hash: pubKeyHex } },
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const rpcJson = await rpcRes.json();
    const balance = parseInt(rpcJson.result?.balance || "0", 10);
    cachedBalance = { motes: balance, checkedAt: now };
    return balance;
  } catch (err) {
    // FAIL-CLOSED: if we can't check balance, use stale cache.
    // If no stale cache exists, return 0 to block recording (fail-closed).
    console.error("Balance check failed:", err.message);
    return cachedBalance.motes ?? 0;
  }
}

// Workbench predefined scenarios (fixed, validated)
const WORKBENCH_SCENARIOS = {
  vendor_payment: {
    agentId: "treasury-agent-01",
    actionClass: "vendor_payment_approval",
    inputData: { invoice_id: "INV-2026-1547", vendor: "Acme Cloud", amount: 8500, currency: "USDT", budget_remaining: 52000 },
    outputData: { decision: "APPROVED", reason: "Within budget threshold (16%)", payment_amount: 8500, approval_confidence: 0.96 },
    jobPaymentRefHash: "x402-job-0x8a1b2c3d",
  },
  defi_swap: {
    agentId: "trading-agent-alpha",
    actionClass: "swap",
    inputData: { pair: "CSPR/USDT", amount: 1000, slippage: 0.5, market_signal: "bullish_breakout" },
    outputData: { executed: true, price: 0.042, received: 997.5, fee: 2.5, confidence: 0.91 },
    jobPaymentRefHash: "x402-swap-0xb2c3d4e5",
  },
  risk_alert: {
    agentId: "risk-monitor-eu",
    actionClass: "risk_alert",
    inputData: { portfolio: "fund-beta", threshold: 0.12, current_drawdown: 0.15, var_95: 95000 },
    outputData: { alert: "DRAWDOWN_EXCEEDED", severity: "MEDIUM", action: "reduce_exposure_15pct", notified: ["risk-team@fund.io"] },
    jobPaymentRefHash: "x402-monitor-0xc3d4e5f6",
  },
};

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// GET /api/decisions — list all decisions
app.get("/api/decisions", (req, res) => {
  const { agent } = req.query;
  let result = [...decisions].reverse(); // newest first
  if (agent && agent !== "all") {
    result = result.filter((d) => d.agentId === agent);
  }
  res.json({ decisions: result, total: result.length });
});

// GET /api/decisions/:id — single decision
app.get("/api/decisions/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const decision = decisions.find((d) => d.decisionId === id);
  if (!decision) {
    return res.status(404).json({ error: "Decision not found" });
  }
  res.json(decision);
});

// GET /api/stats — summary stats (REAL metrics only — no synthetic/derived values)
app.get("/api/stats", (req, res) => {
  const agents = new Set(decisions.map((d) => d.agentId));
  const latestBlock = Math.max(...decisions.map((d) => d.blockHeight || 0));
  const confirmedOnChain = decisions.filter((d) => d.blockHeight > 0).length;
  res.json({
    totalDecisions: decisions.length,
    totalAgents: agents.size,
    latestBlock,
    confirmedOnChain,
    agents: [...agents].map((agentId) => {
      const agentDecs = decisions.filter((d) => d.agentId === agentId);
      const latest = agentDecs[agentDecs.length - 1];
      return {
        agentId,
        totalDecisions: agentDecs.length,
        lastAction: latest?.actionClass || "none",
        lastTimestamp: latest?.timestamp || "",
      };
    }),
  });
});

// POST /api/workbench/record — record a FIXED scenario on-chain (abuse-protected)
app.post("/api/workbench/record", requireSecret, rateLimit, perSessionCap, async (req, res) => {
  const isTestMode = process.env.TEST_MODE && process.env.NODE_ENV === "test";

  // SAFEGUARD 1: Kill-switch — instantly disable all recordings
  if (!RECORDING_ENABLED && !isTestMode) {
    return res.status(403).json({
      error: "Recording disabled",
      detail: "On-chain recording is currently disabled by the operator.",
    });
  }

  // SAFEGUARD 2: Global hard cap — prevent runaway testnet drain
  if (totalRecordCount >= MAX_TOTAL_RECORDS && !isTestMode) {
    return res.status(403).json({
      error: "Global recording limit reached",
      detail: `Maximum ${MAX_TOTAL_RECORDS} total recordings reached. Contact the operator to reset.`,
      totalRecordings: totalRecordCount,
      globalCap: MAX_TOTAL_RECORDS,
    });
  }

  // SAFEGUARD 3: Single-flight mutex — only one tx at a time
  if (recordingInFlight && !isTestMode) {
    return res.status(409).json({
      error: "Recording in progress",
      detail: "Another recording is currently being submitted. Please wait and retry.",
    });
  }

  const { scenario } = req.body;
  const preset = Object.hasOwn(WORKBENCH_SCENARIOS, scenario) ? WORKBENCH_SCENARIOS[scenario] : null;
  if (!preset) {
    return res.status(400).json({
      error: "Invalid scenario",
      detail: `Choose from: ${Object.keys(WORKBENCH_SCENARIOS).join(", ")}`,
    });
  }

  // Key balance guard — FAIL-CLOSED on RPC error (skipped in test mode)
  if (!isTestMode) {
    let balance;
    try {
      balance = await checkKeyBalance();
    } catch (err) {
      console.error("Balance check threw:", err.message);
      return res.status(503).json({
        error: "Balance check failed",
        detail: "Cannot verify key balance. Recording blocked (fail-closed).",
      });
    }
    if (balance < MIN_BALANCE_MOTES) {
      return res.status(503).json({
        error: "Testnet key balance too low",
        detail: "The demo key needs more CSPR. Please try again later.",
        balanceCspr: (balance / 1e9).toFixed(1),
      });
    }
  }

  // Acquire single-flight lock
  recordingInFlight = true;

  // Use the preset data (no user-controlled input reaches Casper)
  const { agentId, actionClass, inputData, outputData, jobPaymentRefHash } = preset;
  const inputHash = sha256(canonicalize(inputData));
  const outputHash = sha256(canonicalize(outputData));
  const jobRef = jobPaymentRefHash || "";

  try {
    const args = [
      "put-transaction", "package",
      "--node-address", NODE_URL,
      "--secret-key", path.join(KEYS_DIR, "secret_key.pem"),
      "--chain-name", CHAIN_NAME,
      "--contract-package-hash", CONTRACT_PACKAGE,
      "--session-entry-point", "record_decision",
      "--session-arg", `agent_id:string='${agentId}'`,
      "--session-arg", `action_class:string='${actionClass}'`,
      "--session-arg", `input_hash:string='${inputHash}'`,
      "--session-arg", `output_hash:string='${outputHash}'`,
      "--session-arg", `job_payment_ref_hash:string='${jobRef}'`,
      "--payment-amount", "3000000000",
      "--gas-price-tolerance", "1",
      "--pricing-mode", "classic",
      "--standard-payment", "true",
    ];

    const result = JSON.parse(execFileSync("casper-client", args, { timeout: 30000 }).toString());
    const txHash = result.result.transaction_hash.Version1;

    // Increment global counter ONLY on success
    totalRecordCount++;

    const newDecision = {
      decisionId: decisions.length,
      agentId,
      actionClass,
      inputHash,
      outputHash,
      jobPaymentRefHash: jobRef,
      txHash,
      blockHeight: 0,
      timestamp: new Date().toISOString(),
      inputData,
      outputData,
    };
    decisions.push(newDecision);
    saveStore();

    res.json({
      success: true,
      decisionId: newDecision.decisionId,
      inputHash,
      outputHash,
      txHash,
      explorerUrl: `https://testnet.cspr.live/transaction/${txHash}`,
      recordingsRemaining: MAX_TOTAL_RECORDS - totalRecordCount,
      // Full decision record — frontend uses this directly so it doesn't need a second fetch
      // against the static /decisions.json (which only contains seeded data).
      decision: newDecision,
    });
  } catch (err) {
    console.error("Transaction submission failed:", err.message);
    res.status(500).json({ error: "Failed to submit transaction", detail: "Internal error — check server logs" });
  } finally {
    // Always release the mutex
    recordingInFlight = false;
  }
});

// GET /api/workbench/scenarios — list available scenarios
app.get("/api/workbench/scenarios", (req, res) => {
  res.json({
    scenarios: Object.entries(WORKBENCH_SCENARIOS).map(([key, val]) => ({
      id: key,
      agentId: val.agentId,
      actionClass: val.actionClass,
      description: key.replace(/_/g, " "),
    })),
  });
});

// GET /api/workbench/limits — current rate limit + session + global usage
app.get("/api/workbench/limits", (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const entry = rateLimitMap.get(ip);
  const sessionCount = sessionCounts.get(ip) || 0;
  res.json({
    recordingEnabled: RECORDING_ENABLED,
    global: { recordings: totalRecordCount, cap: MAX_TOTAL_RECORDS, remaining: Math.max(0, MAX_TOTAL_RECORDS - totalRecordCount) },
    rateLimit: { max: RATE_LIMIT_MAX, remaining: entry ? Math.max(0, RATE_LIMIT_MAX - entry.count) : RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS },
    session: { recordings: sessionCount, cap: SESSION_CAP },
  });
});

// POST /api/record — REMOVED (security: user-controlled strings to signer).
// Use /api/workbench/record with fixed scenarios only.

// POST /api/verify — verify decision integrity against on-chain Casper RPC transaction args
// The authoritative source is the transaction's named args on-chain, NOT the local store.
// Fail-closed: if the RPC is unavailable or args cannot be parsed, verification fails.
app.post("/api/verify", async (req, res) => {
  const { decisionId, inputData, outputData } = req.body;

  if (decisionId === undefined || !inputData || !outputData) {
    return res.status(400).json({ error: "Missing decisionId, inputData, or outputData" });
  }

  const decision = decisions.find((d) => d.decisionId === decisionId);
  if (!decision) {
    return res.status(404).json({ error: "Decision not found" });
  }

  // Recompute hashes from the provided data
  const computedInputHash = sha256(canonicalize(inputData));
  const computedOutputHash = sha256(canonicalize(outputData));

  // Query Casper RPC and parse on-chain transaction args — this is the authoritative source
  let chainStatus = "unknown";
  let chainVerified = false; // true = transaction found and args parseable on-chain
  let onChainInputHash = null;
  let onChainOutputHash = null;
  let rpcParseError = null;
  let blockHeight = decision.blockHeight;

  try {
    const rpcRes = await fetch(NODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "info_get_transaction",
        params: { transaction_hash: { Version1: decision.txHash }, finalized_approvals: false },
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const rpcJson = await rpcRes.json();

    if (rpcJson.result && rpcJson.result.transaction) {
      const tx = rpcJson.result.transaction;
      // Casper V2 transaction format: Version1.payload.fields.args.Named (array of [name, value])
      // Fallback: some node versions may use Version1.body.args
      const v1 = tx.Version1;
      const namedArgs =
        v1?.payload?.fields?.args?.Named ||  // standard V2 format
        v1?.body?.args ||                    // alternative format
        null;

      if (Array.isArray(namedArgs)) {
        for (const [argName, argValue] of namedArgs) {
          if (argName === "input_hash") {
            onChainInputHash = argValue?.parsed ?? null;
          } else if (argName === "output_hash") {
            onChainOutputHash = argValue?.parsed ?? null;
          }
        }
      }

      // Extract confirmed block height if available
      if (rpcJson.result.execution_info?.block_height) {
        blockHeight = rpcJson.result.execution_info.block_height;
      }

      if (onChainInputHash !== null && onChainOutputHash !== null) {
        chainStatus = "finalized";
        chainVerified = true; // transaction found and args successfully parsed
      } else {
        chainStatus = "parse_failed";
        rpcParseError = "Could not extract input_hash/output_hash from on-chain transaction args";
      }
    } else if (rpcJson.error) {
      chainStatus = "not_found";
      rpcParseError = rpcJson.error.message || "Transaction not found on-chain";
    } else {
      chainStatus = "pending";
    }
  } catch (err) {
    chainStatus = "rpc_error";
    rpcParseError = err.message;
  }

  // Compare computed hashes against on-chain values (NOT local store)
  // Fail closed: if on-chain values are null (RPC failed), matches are false
  const inputMatch = onChainInputHash !== null && computedInputHash === onChainInputHash;
  const outputMatch = onChainOutputHash !== null && computedOutputHash === onChainOutputHash;
  const verified = inputMatch && outputMatch;

  res.json({
    verified,
    chainVerified,
    chainStatus,
    decisionId,
    onChain: {
      // These hashes are parsed from the on-chain transaction args, not the local store
      inputHash: onChainInputHash,
      outputHash: onChainOutputHash,
      txHash: decision.txHash,
      blockHeight,
      agentId: decision.agentId,
      actionClass: decision.actionClass,
      explorerUrl: `https://testnet.cspr.live/transaction/${decision.txHash}`,
    },
    computed: {
      inputHash: computedInputHash,
      outputHash: computedOutputHash,
    },
    details: {
      inputMatch,
      outputMatch,
      ...(rpcParseError && { rpcParseError }),
    },
  });
});

// GET /api/decisions/:id/finality — check if transaction is confirmed on-chain
app.get("/api/decisions/:id/finality", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const decision = decisions.find((d) => d.decisionId === id);
  if (!decision) {
    return res.status(404).json({ error: "Decision not found" });
  }

  // If already confirmed, return immediately
  if (decision.blockHeight > 0) {
    return res.json({ status: "confirmed", blockHeight: decision.blockHeight, decisionId: id });
  }

  // Check RPC for finality
  try {
    const rpcRes = await fetch(NODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "info_get_transaction",
        params: { transaction_hash: { Version1: decision.txHash }, finalized_approvals: false },
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const rpcJson = await rpcRes.json();

    if (rpcJson.result?.execution_info?.block_height) {
      decision.blockHeight = rpcJson.result.execution_info.block_height;
      saveStore();
      return res.json({ status: "confirmed", blockHeight: decision.blockHeight, decisionId: id });
    }
    return res.json({ status: "pending", blockHeight: 0, decisionId: id });
  } catch {
    return res.json({ status: "pending", blockHeight: 0, decisionId: id });
  }
});

// GET /api/decisions/:id/audit-report — audit-ready receipt report (Markdown or JSON)
app.get("/api/decisions/:id/audit-report", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const decision = decisions.find((d) => d.decisionId === id);
  if (!decision) {
    return res.status(404).json({ error: "Decision not found" });
  }

  const format = (req.query.format || "markdown").toString().toLowerCase();

  // Verify against on-chain data
  let verificationResult = { verified: false, chainStatus: "unknown", onChainInputHash: null, onChainOutputHash: null, blockHeight: decision.blockHeight };
  try {
    const rpcRes = await fetch(NODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "info_get_transaction",
        params: { transaction_hash: { Version1: decision.txHash }, finalized_approvals: false },
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const rpcJson = await rpcRes.json();
    if (rpcJson.result?.transaction) {
      const v1 = rpcJson.result.transaction.Version1;
      const namedArgs = v1?.payload?.fields?.args?.Named || v1?.body?.args || null;
      if (Array.isArray(namedArgs)) {
        for (const [argName, argValue] of namedArgs) {
          if (argName === "input_hash") verificationResult.onChainInputHash = argValue?.parsed ?? null;
          if (argName === "output_hash") verificationResult.onChainOutputHash = argValue?.parsed ?? null;
        }
      }
      if (rpcJson.result.execution_info?.block_height) {
        verificationResult.blockHeight = rpcJson.result.execution_info.block_height;
      }
      if (verificationResult.onChainInputHash && verificationResult.onChainOutputHash) {
        verificationResult.verified =
          verificationResult.onChainInputHash === decision.inputHash &&
          verificationResult.onChainOutputHash === decision.outputHash;
        verificationResult.chainStatus = "finalized";
      }
    }
  } catch { /* fail open — report will note verification failure */ }

  const report = {
    title: "AgentLedger — Audit-Ready Receipt Report",
    generated: new Date().toISOString(),
    receipt: {
      id: decision.decisionId,
      agent: decision.agentId,
      actionClass: decision.actionClass,
      jobPaymentRefHash: decision.jobPaymentRefHash || null,
      timestamp: decision.timestamp,
    },
    cryptographic: {
      inputHash: decision.inputHash,
      outputHash: decision.outputHash,
    },
    onChain: {
      network: "Casper Testnet",
      txHash: decision.txHash,
      blockHeight: verificationResult.blockHeight,
      explorerUrl: `https://testnet.cspr.live/transaction/${decision.txHash}`,
      contractPackage: CONTRACT_PACKAGE,
    },
    verification: {
      status: verificationResult.verified ? "VERIFIED" : verificationResult.chainStatus === "finalized" ? "MISMATCH" : "UNVERIFIABLE",
      chainStatus: verificationResult.chainStatus,
      onChainInputHash: verificationResult.onChainInputHash,
      onChainOutputHash: verificationResult.onChainOutputHash,
      inputMatch: verificationResult.onChainInputHash === decision.inputHash,
      outputMatch: verificationResult.onChainOutputHash === decision.outputHash,
    },
    privacyNote: "No raw prompt or output data is stored on-chain — hashes only. Input/output content can be verified by anyone holding the original data without exposing it publicly.",
  };

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="agentledger-receipt-${id}.json"`);
    return res.json(report);
  }

  // Default: Markdown
  const md = [
    `# AgentLedger — Audit-Ready Receipt Report`,
    ``,
    `**Generated:** ${report.generated}`,
    ``,
    `## Receipt #${report.receipt.id}`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Agent | \`${report.receipt.agent}\` |`,
    `| Action / Job Type | \`${report.receipt.actionClass}\` |`,
    `| Job Payment Ref | \`${report.receipt.jobPaymentRefHash || "—"}\` |`,
    `| Timestamp | ${report.receipt.timestamp} |`,
    ``,
    `## Cryptographic Proof`,
    ``,
    `| Hash | Value |`,
    `|------|-------|`,
    `| Input Hash | \`${report.cryptographic.inputHash}\` |`,
    `| Output Hash | \`${report.cryptographic.outputHash}\` |`,
    ``,
    `## On-Chain Reference`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Network | ${report.onChain.network} |`,
    `| Transaction Hash | \`${report.onChain.txHash}\` |`,
    `| Block Height | ${report.onChain.blockHeight} |`,
    `| Contract | \`${report.onChain.contractPackage}\` |`,
    `| Explorer | [View on Casper Explorer](${report.onChain.explorerUrl}) |`,
    ``,
    `## Verification`,
    ``,
    `| Check | Result |`,
    `|-------|--------|`,
    `| Status | **${report.verification.status}** |`,
    `| Chain Status | ${report.verification.chainStatus} |`,
    `| Input Hash Match | ${report.verification.inputMatch ? "✅ Match" : "❌ Mismatch"} |`,
    `| Output Hash Match | ${report.verification.outputMatch ? "✅ Match" : "❌ Mismatch"} |`,
    ``,
    `## Privacy Note`,
    ``,
    `${report.privacyNote}`,
    ``,
    `---`,
    `*Report generated by [AgentLedger](https://github.com/marchantdev/agentledger)*`,
    ``,
  ].join("\n");

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="agentledger-receipt-${id}.md"`);
  res.send(md);
});

// GET /api/health — health check (includes safeguard status)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    decisions: decisions.length,
    contract: CONTRACT_PACKAGE,
    safeguards: {
      recordingEnabled: RECORDING_ENABLED,
      globalCap: MAX_TOTAL_RECORDS,
      globalRecordings: totalRecordCount,
      singleFlightActive: recordingInFlight,
    },
  });
});

// Serve frontend static files
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // SPA fallback: serve index.html for any non-API route
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

// RPC proxy for local dev (mirrors Vercel Edge Function api/rpc.ts)
const ALLOWED_RPC_METHODS = new Set(["info_get_transaction", "query_balance"]);
app.post("/api/rpc", async (req, res) => {
  const { method } = req.body || {};
  if (!method || !ALLOWED_RPC_METHODS.has(method)) {
    return res.status(403).json({ error: `Method not allowed: ${method}` });
  }
  try {
    const rpcRes = await fetch(NODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await rpcRes.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "RPC proxy error", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`AgentLedger API running on port ${PORT}`);
  console.log(`Loaded ${decisions.length} decisions`);
  console.log(`Serving frontend from ${FRONTEND_DIST}`);
});
