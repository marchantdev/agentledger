# AgentLedger

**Verifiable receipts for autonomous AI agents on Casper.**

> *If an agent gets paid, it leaves a receipt.*

AgentLedger is an on-chain accountability layer for AI agents performing paid work. Every agent decision — approvals, trades, alerts, rejections — is hashed and recorded as an immutable receipt on the Casper blockchain. Anyone can verify that a decision hasn't been tampered with by recomputing hashes and comparing against the on-chain attestation.

**Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon).**

## Live Demo

**[Try it here](https://beast-minnesota-parish-monkey.trycloudflare.com)** (Casper Testnet)

- **Dashboard** — Real-time view of all agent decisions with on-chain explorer links
- **Verify** — Select any decision, edit the data, and watch tamper detection in action
- **Record** — Submit new agent decisions to the Casper testnet
- **Explorer** — Search and filter decisions by agent, action class, or time

## How It Works

```
1. Agent makes a decision (approve payment, execute trade, flag risk)
2. Input and output data are SHA-256 hashed
3. Hashes are submitted to the DecisionRegistry contract on Casper testnet
4. Anyone can verify: re-hash the original data → compare to on-chain → match = verified, mismatch = tampered
```

### Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   React Frontend │────▶│  Express Backend  │────▶│  Casper Testnet (Odra)   │
│   (Vite + TS)    │     │  (Node.js API)    │     │  DecisionRegistry Contract│
│                  │     │                   │     │                          │
│  Dashboard       │     │  GET /decisions   │     │  record_decision()       │
│  Verify Page     │     │  POST /verify     │     │  get_decision()          │
│  Record Page     │     │  POST /record     │     │  get_total_decisions()   │
│  Explorer        │     │  GET /stats       │     │  get_agent_decision_count│
└──────────────────┘     └──────────────────┘     └──────────────────────────┘
```

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
| 0 | treasury-agent-01 | vendor_payment_approval | 8233736 | [2ab7b9c8...](https://testnet.cspr.live/transaction/2ab7b9c8400274066754386ca999ae6344a85d0c33ff6ec433fa5991eeb9e536) |

> Additional demo scenarios are stored locally and can be re-recorded on-chain via `POST /api/record`. The verification endpoint confirms each decision's tx hash exists on the Casper testnet in real time.

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
└── frontend/          # React dashboard (Vite + TypeScript + Tailwind)
    ├── src/
    │   ├── pages/     # Landing, Dashboard, Explore, Verify, Record, About
    │   ├── components/  # Navbar, Hero, DataGrid, StatCards, etc.
    │   ├── lib/       # API client, types, utilities
    │   └── theme.config.ts
    ├── package.json
    └── vite.config.ts
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

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + decision count |
| `/api/decisions` | GET | List all decisions (optional `?agent=` filter) |
| `/api/decisions/:id` | GET | Get single decision by ID |
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

## Differentiation

- **vs EAS (Ethereum Attestation Service):** EAS is a generic attestation substrate. AgentLedger is a purpose-built product for agent work receipts with tamper-detection UI, tied to Casper/x402 payment flows.
- **vs zkML (EZKL, zkPyTorch):** zkML proves computation/inference correctness. AgentLedger proves *operational accountability* — what an agent claimed to do, when, and under which job/payment context.
- **vs research papers:** AgentLedger is a shippable demo with live on-chain transactions, not research infrastructure.

## Tech Stack

- **Blockchain:** [Casper Network](https://casper.network) (Testnet)
- **Smart Contract:** [Odra Framework](https://odra.dev) (Rust)
- **Backend:** Express.js (Node.js)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS
- **Hashing:** SHA-256 (canonical JSON serialization)

## License

MIT
