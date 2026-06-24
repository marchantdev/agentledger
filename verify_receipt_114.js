#!/usr/bin/env node
// verify_receipt_114.js — Independently verify AgentLedger receipt #114 against Casper testnet.
// No dependencies (Node 18+).  Run:  node verify_receipt_114.js
const RPC = "https://node.testnet.casper.network/rpc";
const TX  = "65cfa46316e0dbc24cabef28825134ea3119b636ca826a46c304b8d0502fa328";
const EXPECT = {
  contract: "f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb",
  entry_point: "record_decision",
  agent_id: "treasury-agent-01",
  action_class: "vendor_payment_approval",
  input_hash: "ac8c833e625282a233822193fa657f4f8cb6edb75f00fab7aba56a8e0a219e07",
  output_hash: "2463ba13e7fa248a64ecec5abb95a07a0fc1c32b3b7a8668a0a0295bd208c784",
  job_payment_ref_hash: "x402-job-0x8a1b2c3d",
};
(async () => {
  const res = await fetch(RPC, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "info_get_transaction", params: { transaction_hash: { Version1: TX } } }) });
  const j = await res.json();
  if (j.error) { console.error("RPC error:", JSON.stringify(j.error)); process.exit(1); }
  const r = j.result || {};
  const t = (r.transaction || {}).Version1;
  if (!t) { console.error("FAIL: tx not found on-chain"); process.exit(1); }
  const ei = r.execution_info || {};
  const v2 = (ei.execution_result || {}).Version2 || {};
  if (v2.error_message != null) { console.error("FAIL: execution failed:", v2.error_message); process.exit(1); }
  const fields = (t.payload || {}).fields || {};
  const ep = (fields.entry_point || {}).Custom;
  const pkg = ((((fields.target || {}).Stored || {}).id || {}).ByPackageHash || {}).addr;
  const named = {};
  for (const p of ((fields.args || {}).Named || [])) named[p[0]] = (p[1] || {}).parsed;
  let ok = true;
  const check = (label, got, exp) => { const pass = String(got) === String(exp); console.log(`  ${pass ? "PASS" : "FAIL"} ${label}: ${got}`); if (!pass) ok = false; };
  console.log(`Receipt #114 — Casper testnet verification (tx ${TX.slice(0,16)}...)`);
  console.log(`  PASS on-chain, execution SUCCESS, block ${ei.block_height}`);
  check("entry_point", ep, EXPECT.entry_point);
  check("contract_package", pkg, EXPECT.contract);
  for (const k of ["agent_id","action_class","input_hash","output_hash","job_payment_ref_hash"]) check(k, named[k], EXPECT[k]);
  console.log(ok ? "\nVERIFIED: receipt #114 is a real, successful, contract-correct Casper decision attestation." : "\nFAILED: mismatch.");
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error("error:", e.message); process.exit(1); });
