/**
 * AgentLedger — Record a decision receipt on Casper testnet
 *
 * The Workbench API uses fixed scenarios (vendor_payment, defi_swap, risk_alert)
 * to ensure no user-controlled strings reach the signer.
 *
 * Usage:
 *   AGENTLEDGER_URL=http://localhost:3001 \
 *   BACKEND_SECRET=your-secret \
 *   node record.mjs [scenario]
 *
 * Scenarios: vendor_payment (default), defi_swap, risk_alert
 */

const BASE = process.env.AGENTLEDGER_URL || "http://localhost:3001";
const SECRET = process.env.BACKEND_SECRET;
const scenario = process.argv[2] || "vendor_payment";

if (!SECRET) {
  console.error("Error: BACKEND_SECRET environment variable is required");
  process.exit(1);
}

const res = await fetch(`${BASE}/api/workbench/record`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-backend-secret": SECRET,
  },
  body: JSON.stringify({ scenario }),
});

const data = await res.json();
if (!res.ok) {
  console.error("Error:", data.error);
  process.exit(1);
}

console.log("Receipt recorded!");
console.log(`  Decision ID : ${data.decision?.decisionId || data.decisionId}`);
console.log(`  Scenario    : ${scenario}`);
console.log(`  Tx Hash     : ${data.txHash}`);
console.log(`  Explorer    : ${data.explorerUrl}`);
