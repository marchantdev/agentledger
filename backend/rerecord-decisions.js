#!/usr/bin/env node
/**
 * Re-record all 6 demo decisions on-chain via /api/record.
 * Each decision uses the EXACT inputData/outputData shown in the UI.
 * The API computes SHA-256 hashes and submits to Casper testnet.
 *
 * Prerequisites: ~18 CSPR in keys/ wallet (3 CSPR per tx).
 * Usage: node rerecord-decisions.js
 */

const API = "http://localhost:3001";

const DECISIONS = [
  {
    agentId: "treasury-agent-01",
    actionClass: "vendor_payment_approval",
    inputData: {
      invoice_id: "INV-2026-0847",
      vendor: "CloudServ Inc",
      amount: 10000,
      currency: "USDT",
      budget_remaining: 45000,
    },
    outputData: {
      decision: "APPROVED",
      reason: "Within budget threshold (22%)",
      payment_amount: 10000,
      approval_confidence: 0.94,
    },
    jobPaymentRefHash: "x402-job-0x7f3a2b1c",
  },
  {
    agentId: "treasury-agent-01",
    actionClass: "payment_rejection",
    inputData: {
      invoice_id: "INV-2026-0903",
      vendor: "DataSync LLC",
      amount: 38000,
      currency: "USDT",
      budget_remaining: 45000,
    },
    outputData: {
      decision: "REJECTED",
      reason: "Exceeds single-vendor limit (84% of remaining budget)",
      risk_score: 0.91,
    },
    jobPaymentRefHash: "x402-job-0x2a9c1d4e",
  },
  {
    agentId: "risk-monitor-02",
    actionClass: "risk_alert",
    inputData: {
      asset: "CSPR/USDT",
      volatility_24h: 0.087,
      threshold: 0.05,
      position_size: 25000,
    },
    outputData: {
      alert_level: "HIGH",
      action: "reduce_exposure",
      recommended_reduction: 0.4,
      reason: "24h volatility 74% above threshold",
    },
    jobPaymentRefHash: "",
  },
  {
    agentId: "trading-agent-03",
    actionClass: "swap",
    inputData: {
      pair: "CSPR/USDT",
      side: "BUY",
      amount: 5000,
      limit_price: 0.042,
      slippage_tolerance: 0.005,
    },
    outputData: {
      executed: true,
      fill_price: 0.0418,
      filled_amount: 5000,
      fee: 5.0,
    },
    jobPaymentRefHash: "x402-job-0x8b4f7e23",
  },
  {
    agentId: "compliance-agent-04",
    actionClass: "vendor_payment_approval",
    inputData: {
      invoice_id: "INV-2026-0952",
      vendor: "SecureNet Corp",
      amount: 7500,
      currency: "USDT",
      contract_ref: "SNC-2026-Q2",
    },
    outputData: {
      decision: "APPROVED",
      reason: "Within policy limits, vendor verified",
      payment_amount: 7500,
      approval_confidence: 0.97,
    },
    jobPaymentRefHash: "x402-job-0x3c5d8f12",
  },
  {
    agentId: "trading-agent-03",
    actionClass: "rebalance",
    inputData: {
      portfolio: { CSPR: 0.45, USDT: 0.35, ETH: 0.20 },
      target: { CSPR: 0.40, USDT: 0.40, ETH: 0.20 },
      total_value: 100000,
    },
    outputData: {
      trades_executed: 2,
      cspr_sold: 5000,
      usdt_bought: 5000,
      new_allocation: { CSPR: 0.40, USDT: 0.40, ETH: 0.20 },
    },
    jobPaymentRefHash: "x402-job-0x1a2b3c4d",
  },
];

async function recordDecision(data, index) {
  console.log(`\n[${index + 1}/6] Recording: ${data.agentId} / ${data.actionClass}`);

  const res = await fetch(`${API}/api/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  FAILED: ${res.status} ${err}`);
    return null;
  }

  const result = await res.json();
  console.log(`  TX: ${result.txHash}`);
  console.log(`  Input hash: ${result.inputHash}`);
  console.log(`  Output hash: ${result.outputHash}`);
  console.log(`  Explorer: ${result.explorerUrl}`);
  return result;
}

async function main() {
  console.log("AgentLedger — Re-recording 6 demo decisions on Casper testnet");
  console.log("Each tx costs ~3 CSPR. Total: ~18 CSPR.");

  // Clear the existing store first
  const fs = require("fs");
  const storePath = require("path").join(__dirname, "decisions-store.json");
  fs.writeFileSync(storePath, "[]");
  console.log("\nCleared decisions-store.json");

  const results = [];
  for (let i = 0; i < DECISIONS.length; i++) {
    const result = await recordDecision(DECISIONS[i], i);
    results.push(result);

    if (!result) {
      console.error(`\nStopped at decision ${i + 1} due to error.`);
      console.error("Check CSPR balance: casper-client get-balance ...");
      break;
    }

    // Wait 5s between txs for block confirmation
    if (i < DECISIONS.length - 1) {
      console.log("  Waiting 5s for block confirmation...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const successful = results.filter(Boolean).length;
  console.log(`\n=== Done: ${successful}/${DECISIONS.length} decisions recorded ===`);

  if (successful === DECISIONS.length) {
    console.log("\nAll decisions recorded. Verify with:");
    console.log("  curl http://localhost:3001/api/decisions | python3 -m json.tool");
    console.log("\nNow update seed-decisions.json from the store:");
    console.log("  cp decisions-store.json seed-decisions.json");
  }
}

main().catch(console.error);
