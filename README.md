# AgentLedger

**Verifiable receipts for autonomous AI agents on Casper.**

> *If an agent gets paid, it leaves a receipt.*

AgentLedger is a Casper-native accountability layer for AI agents performing paid work. Every agent decision — approvals, trades, alerts, rejections — is hashed and recorded as an immutable receipt on the Casper blockchain via an Odra smart contract. Each receipt binds the agent's decision to a **payment/job reference hash**, linking what the agent decided to the work it was paid for. Anyone can verify that a decision hasn't been tampered with by recomputing hashes and comparing against the on-chain attestation. Casper's enterprise-grade finality and institutional adoption roadmap make it the natural ledger for regulated agent work — agents operating in finance, compliance, and operations need audit trails that institutions can trust.

**Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon).**

## Live Demo

**[Try it here](https://frontend-beige-zeta-86.vercel.app)** (Casper Testnet)

- **Dashboard** — Real-time view of all agent decisions with on-chain stats and explorer links
- **Receipts** — Shareable `/receipt/:id` pages with chain verification badge, tamper demo, and QR code
- **Agent Workbench** — Browse 6 recorded agent decisions with on-chain proof links
- **Verify** — Select any decision, edit the data, and watch tamper detection in action
- **Audit Export** — Download audit-ready receipt reports in Markdown or JSON
- **Explorer** — Search and filter decisions by agent, action class, or time

## How It Works

```
1. Agent makes a decision (approve payment, execute trade, flag risk)
2. Input, output, and a payment/job reference are SHA-256 hashed
3. Hashes are submitted to the DecisionRegistry contract on Casper testnet
4. Anyone can verify: re-hash the original data → compare to on-chain → match = verified, mismatch = tampered
```

The **payment/job reference hash** is the key differentiator — it ties each decision receipt to the specific job or payment the agent was fulfilling. This makes AgentLedger audit-ready: auditors can trace from a financial record to the exact on-chain proof of the agent's decision.

### Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   React Frontend │────▶│  Vercel Edge Fn   │────▶│  Casper Testnet (Odra)   │
│   (Vite + TS)    │     │  /api/rpc proxy   │     │  DecisionRegistry Contract│
│                  │     │  (CORS bypass)    │     │                          │
│  Dashboard       │     └──────────────────┘     │  record_decision()       │
│  Verify Page     │                               │  get_decision()          │
│  Workbench       │  Client-side SHA-256 hashing  │  get_total_decisions()   │
│  Receipt/Export  │  Static decisions.json         │  get_agent_decision_count│
└──────────────────┘                               └──────────────────────────┘
```

> **Note:** The frontend runs fully static on Vercel. Verification calls Casper RPC
> directly via a thin Edge Function proxy (CORS). No backend server required.
> Recording new decisions requires the backend with a signing key.

### On-Chain Contract

The `DecisionRegistry` is an [Odra](https://odra.dev) smart contract (Rust) deployed on Casper testnet:

- **Contract**: [`contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a`](https://testnet.cspr.live/contract/contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a)
- **Package**: `hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb`
- **Network**: Casper Testnet (`casper-test`)

Each decision stores: `agent_id`, `action_class`, `input_hash`, `output_hash`, `job_payment_ref_hash`, `decision_id`.

### Tamper Detection

The verification flow is the core feature:

1. Select a recorded decision (e.g., "treasury-agent-01 approved a $10,000 payment")
2. The original input/output data is loaded
3. Edit any field — change the amount from $10,000 to $15,000
4. Click "Verify Against Chain"
5. Result: **TAMPERED** — the recomputed SHA-256 hash no longer matches the on-chain attestation

This proves the decision record hasn't been altered since it was attested.

### Verified On-Chain Transactions

| Decision | Agent | Action | Block | TX |
|----------|-------|--------|-------|----|
| 0 | treasury-agent-01 | vendor_payment_approval | 8256786 | [33d0c305...](https://testnet.cspr.live/transaction/33d0c30518c49eee0d1da80d6002020e54aff02b12b7a899e36e1b25b7dc90de) |
| 1 | treasury-agent-01 | payment_rejection | 8256787 | [dc6d937f...](https://testnet.cspr.live/transaction/dc6d937f77d868999d80200bd214d4c67470e4ccbfee9cdc64366b7e29e7d3ef) |
| 2 | risk-monitor-02 | risk_alert | 8256788 | [68fb33ab...](https://testnet.cspr.live/transaction/68fb33abbf3f61564bc5f36ea73665d1dc1cfca9986cd7d35a92c4eca8742483) |
| 3 | trading-agent-03 | swap | 8256789 | [bd9165f4...](https://testnet.cspr.live/transaction/bd9165f409b6a4e81dfc602f0369e402aa5e8d00d4aff2c21858b6bb88ab47dc) |
| 4 | compliance-agent-04 | vendor_payment_approval | 8256789 | [a8553b37...](https://testnet.cspr.live/transaction/a8553b3715a3947147e7f36863e0d25db920507369e4972aee4dee7e56fb757e) |
| 5 | trading-agent-03 | rebalance | 8256790 | [fdfd7b9c...](https://testnet.cspr.live/transaction/fdfd7b9cbe52109e0d62a008018ea45fbfdd1f56c4682d46c50a3fa9b8f3340a) |

All 6 decisions are verified on Casper testnet. Click any transaction to view on the Casper block explorer.

## Project Structure

```
agentledger/
├── contract/          # Odra smart contract (Rust)
│   ├── src/
│   │   ├── decision_registry.rs   # Core contract: record, query, verify
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── Odra.toml
├── backend/           # Express API server (Node.js)
│   ├── server.js      # REST API + static file serving
│   ├── seed-decisions.json
│   └── package.json
├── frontend/          # React dashboard (Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── pages/     # Landing, Dashboard, Explore, Verify, Record, Receipt, Workbench, About
│   │   ├── components/  # Navbar, Hero, DataGrid, StatCards, etc.
│   │   ├── lib/       # API client, types, utilities
│   │   └── theme.config.ts
│   ├── package.json
│   └── vite.config.ts
└── examples/          # Integration examples
    └── node-agent/    # Node.js agent recording example
        └── record.mjs
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust toolchain (for contract compilation)
- [Odra CLI](https://odra.dev/docs/) (for contract deployment)
- `casper-client` CLI (for testnet interaction)

### Run the Backend

```bash
cd backend
npm install
node server.js
# API runs on http://localhost:3001
```

### Run the Frontend (Development)

```bash
cd frontend
npm install
npm run dev
# Dev server on http://localhost:5173, proxies /api to backend
```

### Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/ — served by the backend automatically
```

### Compile the Contract

```bash
cd contract
cargo odra build
# Outputs WASM to contract/wasm/
```

### Deploy to Casper Testnet

```bash
# Get testnet CSPR from faucet: https://testnet.cspr.live/tools/faucet
casper-client put-transaction package \
  --node-address https://node.testnet.casper.network/rpc \
  --secret-key ./keys/secret_key.pem \
  --chain-name casper-test \
  --contract-package-hash "hash-YOUR_PACKAGE_HASH" \
  --session-entry-point "record_decision" \
  --session-arg 'agent_id:string='"'"'my-agent'"'"'' \
  --session-arg 'action_class:string='"'"'trade'"'"'' \
  --session-arg 'input_hash:string='"'"'abc123'"'"'' \
  --session-arg 'output_hash:string='"'"'def456'"'"'' \
  --session-arg 'job_payment_ref_hash:string='"'"'job-ref'"'"'' \
  --payment-amount 3000000000 \
  --gas-price-tolerance 10 \
  --pricing-mode classic \
  --standard-payment true
```

## Quick Integration (Node.js)

Record an agent decision in ~10 lines:

```js
const res = await fetch("http://localhost:3001/api/record", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentId: "my-billing-agent",
    actionClass: "invoice_approval",
    inputData: { invoice_id: "INV-2026-0042", vendor: "Acme Corp", amount: 1200 },
    outputData: { decision: "APPROVED", reason: "Within budget", confidence: 0.95 },
    jobPaymentRefHash: "job-ref-abc123",
  }),
});
const { txHash, explorerUrl } = await res.json();
console.log(`Receipt on-chain: ${explorerUrl}`);
```

See [`examples/node-agent/record.mjs`](examples/node-agent/record.mjs) for a complete runnable example.

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + decision count |
| `/api/decisions` | GET | List all decisions (optional `?agent=` filter) |
| `/api/decisions/:id` | GET | Get single decision by ID |
| `/api/decisions/:id/audit-report` | GET | Audit-ready receipt report (`?format=markdown\|json`) |
| `/api/stats` | GET | Summary statistics (agents, counts, latest block) |
| `/api/verify` | POST | Verify decision integrity against on-chain hashes |
| `/api/record` | POST | Record a new decision on-chain via `casper-client` |

### Record + Verify Example (end-to-end reproducible)

**Step 1: Record a new decision on-chain**

```bash
curl -X POST http://localhost:3001/api/record \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-treasury-agent",
    "actionClass": "vendor_payment_approval",
    "inputData": {"invoice_id":"INV-2026-0001","vendor":"Acme Corp","amount":5000,"currency":"USDT","budget_remaining":20000},
    "outputData": {"decision":"APPROVED","reason":"Within budget threshold","approval_confidence":0.91},
    "jobPaymentRefHash": "x402-job-0xabc123"
  }'
```

Response:
```json
{
  "success": true,
  "decisionId": 1,
  "inputHash": "a3f2...",
  "outputHash": "b4e1...",
  "txHash": "3c7d...",
  "explorerUrl": "https://testnet.cspr.live/transaction/3c7d..."
}
```

**Step 2: Verify the recorded decision (exact original data)**

```bash
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": 1,
    "inputData": {"invoice_id":"INV-2026-0001","vendor":"Acme Corp","amount":5000,"currency":"USDT","budget_remaining":20000},
    "outputData": {"decision":"APPROVED","reason":"Within budget threshold","approval_confidence":0.91}
  }'
```

Response (`verified: true`, transaction confirmed on Casper Testnet):
```json
{
  "verified": true,
  "chainVerified": true,
  "chainStatus": "finalized",
  "onChain": { "inputHash": "a3f2...", "txHash": "3c7d...", "blockHeight": 8234100 },
  "computed": { "inputHash": "a3f2..." },
  "details": { "inputMatch": true, "outputMatch": true }
}
```

**Step 3: Verify with tampered data** (change `amount` from 5000 to 9999):

```bash
curl -X POST http://localhost:3001/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": 1,
    "inputData": {"invoice_id":"INV-2026-0001","vendor":"Acme Corp","amount":9999,"currency":"USDT","budget_remaining":20000},
    "outputData": {"decision":"APPROVED","reason":"Within budget threshold","approval_confidence":0.91}
  }'
```

Response (`verified: false` — tamper detected):
```json
{
  "verified": false,
  "chainVerified": true,
  "chainStatus": "finalized",
  "details": { "inputMatch": false, "outputMatch": true }
}
```

The hash mismatch proves the input was altered after being attested on-chain.

### Self-Check (integrity verification)

```bash
cd backend
node self-check.js
```

Runs 3 automated checks:
1. **Hash integrity** — independently computes SHA-256 of stored data and compares to stored hashes
2. **API verification** — verifies original data via `/api/verify` (must return `verified: true`)
3. **Tamper detection** — modifies data and verifies detection (must return `verified: false`)

### Batch Re-Record (demo setup)

```bash
cd backend
node rerecord-decisions.js
```

Records 6 demo decisions on-chain with real SHA-256 hashes. Requires ~18 CSPR in the signing key.

## Why Casper

AgentLedger is Casper-native by design, not a chain-agnostic tool ported to Casper:

- **Institutional positioning:** Casper targets enterprise and regulated industries. Agent accountability fits this thesis — financial institutions deploying AI agents need audit trails on infrastructure they can trust.
- **Odra framework (Rust):** The DecisionRegistry is a native Odra smart contract, not a Solidity port. Rust's safety guarantees and Odra's developer ergonomics make contract development first-class.
- **Finality guarantees:** Casper's consensus finality means a recorded receipt is final. No reorg risk — clear confirmation and finality semantics, critical for audit-grade records.
- **Gas-efficient hash storage:** Casper's named-key storage model stores hashes efficiently. No raw prompts or output data on-chain — hashes only, keeping costs predictable.

## Differentiation

- **vs EAS (Ethereum Attestation Service):** EAS is a generic attestation substrate. AgentLedger is a purpose-built product for agent work receipts with tamper-detection UI and audit-ready exports, native to Casper's institutional stack.
- **vs zkML (EZKL, zkPyTorch):** zkML proves computation/inference correctness. AgentLedger proves *operational accountability* — what an agent claimed to do, when, and under which job/payment context.
- **vs generic logging:** Centralized logs can be edited. AgentLedger receipts are immutable on-chain and independently verifiable by anyone with the original data.

## Tech Stack

- **Blockchain:** [Casper Network](https://casper.network) (Testnet)
- **Smart Contract:** [Odra Framework](https://odra.dev) (Rust)
- **Backend:** Express.js (Node.js)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS
- **Hashing:** SHA-256 (canonical JSON serialization)

## License

MIT
