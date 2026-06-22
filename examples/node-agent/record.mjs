/**
 * AgentLedger — Record a decision receipt on Casper testnet
 *
 * Usage:  AGENTLEDGER_URL=http://localhost:3001 node record.mjs
 */

const BASE = process.env.AGENTLEDGER_URL || "http://localhost:3001";

const decision = {
  agentId: "my-billing-agent",
  actionClass: "invoice_approval",
  inputData: { invoice_id: "INV-2026-0042", vendor: "Acme Corp", amount: 1200 },
  outputData: { decision: "APPROVED", reason: "Within budget", confidence: 0.95 },
  jobPaymentRefHash: "job-ref-abc123",
};

const res = await fetch(`${BASE}/api/record`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(decision),
});

const data = await res.json();
if (!res.ok) {
  console.error("Error:", data.error);
  process.exit(1);
}

console.log("Receipt recorded!");
console.log(`  Decision ID : ${data.decisionId}`);
console.log(`  Input Hash  : ${data.inputHash}`);
console.log(`  Output Hash : ${data.outputHash}`);
console.log(`  Tx Hash     : ${data.txHash}`);
console.log(`  Explorer    : ${data.explorerUrl}`);
