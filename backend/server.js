const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const SEED_PATH = path.join(__dirname, "seed-decisions.json");
const STORE_PATH = path.join(__dirname, "decisions-store.json");
const KEYS_DIR = path.join(__dirname, "..", "keys");
const CONTRACT_PACKAGE = "hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb";
const NODE_URL = "https://node.testnet.casper.network/rpc";
const CHAIN_NAME = "casper-test";

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

// Per-session cap: max recordings per session token (cookie or header)
const SESSION_CAP = 5; // max 5 recordings per session
const sessionCounts = new Map(); // sessionId -> count

function perSessionCap(req, res, next) {
  const sessionId = req.headers["x-session-id"] || req.ip || "anon";
  const count = sessionCounts.get(sessionId) || 0;
  if (count >= SESSION_CAP) {
    return res.status(429).json({
      error: "Session recording limit reached",
      detail: `Maximum ${SESSION_CAP} recordings per session to preserve testnet resources.`,
      sessionRecordings: count,
      sessionCap: SESSION_CAP,
    });
  }
  sessionCounts.set(sessionId, count + 1);
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
    // Read public key from the secret key PEM
    const pubKeyHex = execFileSync("casper-client", [
      "account-address", "--public-key", path.join(KEYS_DIR, "secret_key.pem"),
    ], { timeout: 5000 }).toString().trim();

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
  } catch {
    // On error, use stale cache or assume sufficient
    return cachedBalance.motes ?? MIN_BALANCE_MOTES + 1;
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
app.post("/api/workbench/record", rateLimit, perSessionCap, async (req, res) => {
  const { scenario } = req.body;
  const preset = WORKBENCH_SCENARIOS[scenario];
  if (!preset) {
    return res.status(400).json({
      error: "Invalid scenario",
      detail: `Choose from: ${Object.keys(WORKBENCH_SCENARIOS).join(", ")}`,
    });
  }

  // Key balance guard
  const balance = await checkKeyBalance();
  if (balance < MIN_BALANCE_MOTES) {
    return res.status(503).json({
      error: "Testnet key balance too low",
      detail: "The demo key needs more CSPR. Please try again later.",
      balanceCspr: (balance / 1e9).toFixed(1),
    });
  }

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
      "--session-arg", `agent_id:string=${agentId}`,
      "--session-arg", `action_class:string=${actionClass}`,
      "--session-arg", `input_hash:string=${inputHash}`,
      "--session-arg", `output_hash:string=${outputHash}`,
      "--session-arg", `job_payment_ref_hash:string=${jobRef}`,
      "--payment-amount", "3000000000",
      "--gas-price-tolerance", "10",
      "--pricing-mode", "classic",
      "--standard-payment", "true",
    ];

    const result = JSON.parse(execFileSync("casper-client", args, { timeout: 30000 }).toString());
    const txHash = result.result.transaction_hash.Version1;

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
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit transaction", detail: err.message });
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

// GET /api/workbench/limits — current rate limit + session usage
app.get("/api/workbench/limits", (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const sessionId = req.headers["x-session-id"] || ip;
  const entry = rateLimitMap.get(ip);
  const sessionCount = sessionCounts.get(sessionId) || 0;
  res.json({
    rateLimit: { max: RATE_LIMIT_MAX, remaining: entry ? Math.max(0, RATE_LIMIT_MAX - entry.count) : RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS },
    session: { recordings: sessionCount, cap: SESSION_CAP },
  });
});

// POST /api/record — record a new decision on-chain (also rate-limited for public safety)
app.post("/api/record", rateLimit, perSessionCap, async (req, res) => {
  const { agentId, actionClass, inputData, outputData, jobPaymentRefHash } = req.body;

  if (!agentId || !actionClass || !inputData || !outputData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const inputHash = sha256(canonicalize(inputData));
    const outputHash = sha256(canonicalize(outputData));
    const jobRef = jobPaymentRefHash || "";

    // Validate string inputs — reject shell metacharacters
    const safeStr = /^[a-zA-Z0-9_\-.:/ ]{1,128}$/;
    if (!safeStr.test(agentId)) return res.status(400).json({ error: "Invalid agentId" });
    if (!safeStr.test(actionClass)) return res.status(400).json({ error: "Invalid actionClass" });
    if (jobRef && !safeStr.test(jobRef)) return res.status(400).json({ error: "Invalid jobPaymentRefHash" });

    // Submit to Casper via casper-client — using execFileSync (no shell) to prevent injection
    const args = [
      "put-transaction", "package",
      "--node-address", NODE_URL,
      "--secret-key", path.join(KEYS_DIR, "secret_key.pem"),
      "--chain-name", CHAIN_NAME,
      "--contract-package-hash", CONTRACT_PACKAGE,
      "--session-entry-point", "record_decision",
      "--session-arg", `agent_id:string=${agentId}`,
      "--session-arg", `action_class:string=${actionClass}`,
      "--session-arg", `input_hash:string=${inputHash}`,
      "--session-arg", `output_hash:string=${outputHash}`,
      "--session-arg", `job_payment_ref_hash:string=${jobRef}`,
      "--payment-amount", "3000000000",
      "--gas-price-tolerance", "10",
      "--pricing-mode", "classic",
      "--standard-payment", "true",
    ];

    const result = JSON.parse(execFileSync("casper-client", args, { timeout: 30000 }).toString());
    const txHash = result.result.transaction_hash.Version1;

    // Add to local store
    const newDecision = {
      decisionId: decisions.length,
      agentId,
      actionClass,
      inputHash,
      outputHash,
      jobPaymentRefHash: jobRef,
      txHash,
      blockHeight: 0, // will be populated when confirmed
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
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit transaction", detail: err.message });
  }
});

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

// GET /api/health — health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", decisions: decisions.length, contract: CONTRACT_PACKAGE });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AgentLedger API running on port ${PORT}`);
  console.log(`Loaded ${decisions.length} decisions`);
  console.log(`Serving frontend from ${FRONTEND_DIST}`);
});
