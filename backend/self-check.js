#!/usr/bin/env node
/**
 * Self-check: pick one decision, independently compute SHA-256,
 * compare to stored hash, then test tamper detection.
 * Run after rerecord-decisions.js to verify integrity.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const API = "http://localhost:3001";
const STORE_PATH = path.join(__dirname, "decisions-store.json");

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

async function main() {
  const decisions = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  if (decisions.length === 0) {
    console.error("No decisions in store. Run rerecord-decisions.js first.");
    process.exit(1);
  }

  // Pick the first decision
  const d = decisions[0];
  console.log(`=== Self-Check: Decision #${d.decisionId} ===`);
  console.log(`Agent: ${d.agentId}`);
  console.log(`Action: ${d.actionClass}`);
  console.log(`TX: ${d.txHash}`);
  console.log();

  // Step 1: Independently compute SHA-256 of the stored data
  const computedInputHash = sha256(canonicalize(d.inputData));
  const computedOutputHash = sha256(canonicalize(d.outputData));

  console.log("Step 1: Independent hash computation");
  console.log(`  Stored input hash:   ${d.inputHash}`);
  console.log(`  Computed input hash: ${computedInputHash}`);
  console.log(`  Input match: ${d.inputHash === computedInputHash ? "YES ✓" : "NO ✗"}`);
  console.log();
  console.log(`  Stored output hash:   ${d.outputHash}`);
  console.log(`  Computed output hash: ${computedOutputHash}`);
  console.log(`  Output match: ${d.outputHash === computedOutputHash ? "YES ✓" : "NO ✗"}`);
  console.log();

  if (d.inputHash !== computedInputHash || d.outputHash !== computedOutputHash) {
    console.error("FAIL: Stored hashes don't match computed hashes!");
    process.exit(1);
  }

  // Step 2: Verify via API with original data
  console.log("Step 2: API verification (original data)");
  const verifyRes = await fetch(`${API}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionId: d.decisionId,
      inputData: d.inputData,
      outputData: d.outputData,
    }),
  });
  const verifyData = await verifyRes.json();

  console.log(`  verified: ${verifyData.verified}`);
  console.log(`  chainVerified: ${verifyData.chainVerified}`);
  console.log(`  chainStatus: ${verifyData.chainStatus}`);

  if (!verifyData.verified) {
    console.error("FAIL: Original data doesn't verify!");
    process.exit(1);
  }
  if (!verifyData.chainVerified) {
    console.warn("WARNING: Chain verification failed (tx may still be pending)");
  }
  console.log("  Result: PASS ✓");
  console.log();

  // Step 3: Verify with tampered data
  console.log("Step 3: Tamper detection test");
  const tamperedInput = { ...d.inputData, _tampered: true };
  const tamperRes = await fetch(`${API}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decisionId: d.decisionId,
      inputData: tamperedInput,
      outputData: d.outputData,
    }),
  });
  const tamperData = await tamperRes.json();

  console.log(`  verified: ${tamperData.verified} (should be false)`);
  console.log(`  inputMatch: ${tamperData.details.inputMatch} (should be false)`);
  console.log(`  outputMatch: ${tamperData.details.outputMatch} (should be true)`);

  if (tamperData.verified) {
    console.error("FAIL: Tampered data passed verification!");
    process.exit(1);
  }
  console.log("  Result: TAMPER DETECTED ✓");
  console.log();

  // Summary
  console.log("=== SELF-CHECK PASSED ===");
  console.log(`  Decisions in store: ${decisions.length}`);
  console.log(`  Hash integrity: VERIFIED`);
  console.log(`  API verification: VERIFIED`);
  console.log(`  Tamper detection: VERIFIED`);
  console.log(`  Chain status: ${verifyData.chainStatus}`);
  console.log(`  Explorer: https://testnet.cspr.live/transaction/${d.txHash}`);
}

main().catch((err) => {
  console.error("Self-check failed:", err.message);
  process.exit(1);
});
