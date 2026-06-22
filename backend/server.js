const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { execSync } = require("child_process");
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

// GET /api/stats — summary stats
app.get("/api/stats", (req, res) => {
  const agents = new Set(decisions.map((d) => d.agentId));
  const latestBlock = Math.max(...decisions.map((d) => d.blockHeight || 0));
  res.json({
    totalDecisions: decisions.length,
    totalAgents: agents.size,
    latestBlock,
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

// POST /api/record — record a new decision on-chain
app.post("/api/record", async (req, res) => {
  const { agentId, actionClass, inputData, outputData, jobPaymentRefHash } = req.body;

  if (!agentId || !actionClass || !inputData || !outputData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const inputHash = sha256(canonicalize(inputData));
    const outputHash = sha256(canonicalize(outputData));
    const jobRef = jobPaymentRefHash || "";

    // Submit to Casper via casper-client
    const cmd = [
      "casper-client put-transaction package",
      `--node-address ${NODE_URL}`,
      `--secret-key ${path.join(KEYS_DIR, "secret_key.pem")}`,
      `--chain-name ${CHAIN_NAME}`,
      `--contract-package-hash "${CONTRACT_PACKAGE}"`,
      '--session-entry-point "record_decision"',
      `--session-arg 'agent_id:string='"'"'${agentId}'"'"''`,
      `--session-arg 'action_class:string='"'"'${actionClass}'"'"''`,
      `--session-arg 'input_hash:string='"'"'${inputHash}'"'"''`,
      `--session-arg 'output_hash:string='"'"'${outputHash}'"'"''`,
      `--session-arg 'job_payment_ref_hash:string='"'"'${jobRef}'"'"''`,
      "--payment-amount 3000000000",
      "--gas-price-tolerance 10",
      "--pricing-mode classic",
      "--standard-payment true",
    ].join(" ");

    const result = JSON.parse(execSync(cmd, { timeout: 30000 }).toString());
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
