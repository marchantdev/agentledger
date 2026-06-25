# AgentLedger

**Verifiable receipts for AI agents doing paid work — built on Casper.**

> *If an agent gets paid, it leaves a receipt.*

AgentLedger records tamper-evident decision receipts for autonomous AI agents on the Casper blockchain. When an agent makes a decision — approving a payment, executing a trade, flagging a risk — AgentLedger hashes the decision data and stores it on-chain via an Odra smart contract. Each receipt binds the agent's decision to a **payment/job reference hash**, linking what the agent decided to the work it was paid for. Anyone can verify that a receipt hasn't been tampered with by recomputing hashes and comparing against the on-chain attestation. Hash-only storage means no raw prompts or output data on-chain — audit-ready evidence with privacy.

**Built for the [Casper Agentic Buildathon 2026](https://dorahacks.io/hackathon/casper-agentic-buildathon).**

## Live Demo

**[Try it here](https://frontend-beige-zeta-86.vercel.app)** (Casper Testnet)

### Verify the hero receipt yourself (judges)

Receipt **#114** is a real, fresh Casper testnet attestation — verify it independently, no trust required:
- **Open it:** [`/receipt/114`](https://frontend-beige-zeta-86.vercel.app/receipt/114) — shows *"VERIFIED from Casper RPC"*
- **Transaction:** `65cfa46316e0dbc24cabef28825134ea3119b636ca826a46c304b8d0502fa328` · **Block** 8286653 · [explorer](https://testnet.cspr.live/transaction/65cfa46316e0dbc24cabef28825134ea3119b636ca826a46c304b8d0502fa328)
- **One command:** `node verify_receipt_114.js` → queries Casper RPC and confirms execution success, `record_decision`, the contract package, and that all on-chain named args match the displayed receipt → `VERIFIED`
- **Full guide:** [VERIFY_RECEIPT_114.md](VERIFY_RECEIPT_114.md)

The demo includes 6 seed receipts from 4 agent types, recorded on Casper testnet (blocks 8256786–8256790). The 48.5s demo video walks the value prop, the verified hero receipt #114, and tamper detection; the public demo presents these verified on-chain receipts (including hero receipt #114 — independently verifiable via Casper RPC; see VERIFY_RECEIPT_114.md) as a read-only walkthrough. Verification reads Casper RPC transaction arguments directly — no backend trust required.

### What you can do:

- **Agent Workbench** — Run a demo policy agent: watch it evaluate rules step by step (budget checks, vendor approval, risk thresholds) and open the resulting on-chain receipt
- **Paid Agent Job Flow** — Guided 6-phase end-to-end walkthrough: job created → agent evaluates → decision recorded on Casper → receipt bound to payment ref → payer verifies → dispute resolved. The complete paid-agent lifecycle.
- **Receipts** — Shareable `/receipt/:id` pages with chain verification badge, agent policy trace, tamper demo, Casper proof drawer, x402-ready payment binding callout, and QR code
- **Payment Dispute Demo** — Walk through a realistic vendor dispute: a vendor claims $15K was approved, but the on-chain record proves $10K. Five-phase guided investigation.
- **Verify** — Select any decision, edit the data, and watch tamper detection in action
- **Dashboard** — Real-time feed of agent decisions with on-chain stats, agent filter, and explorer links
- **Enterprise Audit Packet** — Download comprehensive per-receipt proof: decision JSON, all hashes, Casper tx hash, block height, contract package, verification + tamper results, markdown explanation
- **Why Casper** — Dedicated docs section explaining deterministic finality, tamper-evidence, RPC verification without backend trust, and agent commerce alignment

## How It Works

```
1. Agent makes a decision (approve payment, execute trade, flag risk)
2. Input data, output data, and payment/job reference are SHA-256 hashed
3. Hashes are submitted to the DecisionRegistry contract on Casper testnet
4. Anyone can verify: re-hash the original data → compare to on-chain → match = verified, mismatch = tampered
```

### Agent Policy Trace

Every decision includes a visible **agent policy trace** — the deterministic rules the agent evaluated before deciding. This is not a frontier LLM; it is a demo policy agent that applies fixed rules (budget thresholds, vendor approval lists, concentration limits). The trace data — `policy_version`, `decision_factors`, `risk_score`, `agent_reasoning_summary` — is included in the receipt and rendered on the receipt page.

### Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   React Frontend │────▶│  Vercel Proxy     │────▶│  Backend (Express)       │
│   (Vite + TS)    │     │  /api/rpc         │     │  /api/workbench/record   │
│                  │     │  /api/workbench/* │     │  casper-client CLI       │
│  Workbench       │     └──────────────────┘     │  (testnet key on server) │
│  Dispute Demo    │                               └──────────┬───────────────┘
│  Verify Page     │  Client-side SHA-256 hashing              │
│  Receipt/Export  │  Static decisions.json         ┌──────────▼───────────────┐
└──────────────────┘                               │  Casper Testnet (Odra)   │
                                                    │  DecisionRegistry        │
                                                    │  record_decision()       │
                                                    │  get_decision()          │
                                                    └──────────────────────────┘
```

> **Note:** Verification is fully client-side — the frontend recomputes SHA-256 hashes
> and compares against Casper RPC transaction args directly. Recording new decisions
> goes through the backend (testnet key never leaves the server). The backend uses
> fixed scenarios only — no user-controlled strings reach the signer.

### On-Chain Contract

The `DecisionRegistry` is an [Odra](https://odra.dev) smart contract (Rust) deployed on Casper testnet:

- **Contract**: [`contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a`](https://testnet.cspr.live/contract/contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a)
- **Package**: `hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb`
- **Network**: Casper Testnet (`casper-test`)

Each decision stores: `agent_id`, `action_class`, `input_hash`, `output_hash`, `job_payment_ref_hash`, `decision_id`.

### Tamper Detection

The verification flow is the core feature:

1. Select a recorded decision (e.g., "treasury-agent-01 approved an $8,500 payment to Acme Cloud")
2. The original input/output data is loaded
3. Edit any field — change the amount from $8,500 to $15,000
4. Click "Verify Against Chain"
5. Result: **TAMPERED** — the recomputed SHA-256 hash no longer matches the on-chain attestation

This proves the decision record hasn't been altered since it was attested.

### Payment Dispute Case File

A guided walkthrough demonstrating why on-chain receipts matter:

1. **Scenario** — A treasury agent approved a vendor payment. The receipt was recorded on Casper.
2. **Dispute** — Three weeks later, the vendor claims $15,000 was approved. The on-chain record shows $10,000.
3. **Evidence** — Side-by-side comparison of the vendor's claim vs. the on-chain record.
4. **Tamper Test** — Hash the vendor's claimed amount against the chain — mismatch proves the claim is false.
5. **Verdict** — Dispute resolved in seconds using cryptographic evidence, not trust.

### Casper Proof Drawer

Each receipt page includes a collapsible "Raw Casper Proof" drawer showing:
- **Named arguments** from the on-chain transaction (input_hash, output_hash, job_payment_ref_hash)
- **Transaction metadata** (hash, block height, contract package, chain, timestamp)
- **RPC verification result** (chain_verified, chain_status, hash match/mismatch)

This is sourced directly from Casper RPC — verified without any third-party explorer.

### Verified On-Chain Transactions

| Decision | Agent | Action | Block | TX |
|----------|-------|--------|-------|----|
| 0 | treasury-agent-01 | vendor_payment_approval | 8256786 | [33d0c305...](https://testnet.cspr.live/transaction/33d0c30518c49eee0d1da80d6002020e54aff02b12b7a899e36e1b25b7dc90de) |
| 1 | treasury-agent-01 | payment_rejection | 8256787 | [dc6d937f...](https://testnet.cspr.live/transaction/dc6d937f77d868999d80200bd214d4c67470e4ccbfee9cdc64366b7e29e7d3ef) |
| 2 | risk-monitor-02 | risk_alert | 8256788 | [68fb33ab...](https://testnet.cspr.live/transaction/68fb33abbf3f61564bc5f36ea73665d1dc1cfca9986cd7d35a92c4eca8742483) |
| 3 | trading-agent-03 | swap | 8256789 | [bd9165f4...](https://testnet.cspr.live/transaction/bd9165f409b6a4e81dfc602f0369e402aa5e8d00d4aff2c21858b6bb88ab47dc) |
| 4 | compliance-agent-04 | vendor_payment_approval | 8256789 | [a8553b37...](https://testnet.cspr.live/transaction/a8553b3715a3947147e7f36863e0d25db920507369e4972aee4dee7e56fb757e) |
| 5 | trading-agent-03 | rebalance | 8256790 | [fdfd7b9c...](https://testnet.cspr.live/transaction/fdfd7b9cbe52109e0d62a008018ea45fbfdd1f56c4682d46c50a3fa9b8f3340a) |
| **114** | **treasury-agent-01** | **vendor_payment_approval** | **8286653** | [**65cfa463...**](https://testnet.cspr.live/transaction/65cfa46316e0dbc24cabef28825134ea3119b636ca826a46c304b8d0502fa328) — hero, judge-verifiable |

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
│   ├── server.js      # REST API + casper-client bridge
│   ├── seed-decisions.json
│   └── package.json
├── frontend/          # React dashboard (Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── pages/     # Landing, Dashboard, Workbench, Verify, Receipt, Dispute, JobFlow, About
│   │   ├── components/
│   │   ├── lib/       # API client, Casper verification, types
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

### Run the Frontend (Development)

```bash
cd frontend
npm install
npm run dev
# Dev server on http://localhost:5173
```

### Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/ — deployable to Vercel or any static host
```

### Run the Backend (optional — for recording new decisions)

```bash
cd backend
npm install
node server.js
# API runs on http://localhost:3001
```

### Compile the Contract

```bash
cd contract
cargo odra build
# Outputs WASM to contract/wasm/
```

## Quick Integration (Node.js)

Record an agent decision via the Agent Workbench API:

```js
// Run a preset scenario (vendor_payment, defi_swap, risk_alert)
const res = await fetch("http://localhost:3001/api/workbench/record", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-backend-secret": process.env.BACKEND_SECRET,
  },
  body: JSON.stringify({ scenario: "vendor_payment" }),
});
const { decision, txHash, explorerUrl } = await res.json();
console.log(`Receipt on-chain: ${explorerUrl}`);
```

The Workbench API uses fixed scenarios with preset agent data — no user-controlled strings reach the signer. See [`examples/node-agent/record.mjs`](examples/node-agent/record.mjs) for a complete runnable example.

## Why Casper

AgentLedger is Casper-native by design:

- **Institutional positioning:** Casper targets enterprise and regulated industries. Agents operating in finance and operations need audit-ready evidence on infrastructure that institutions trust.
- **Odra framework (Rust):** The DecisionRegistry is a native Odra smart contract. Rust's safety guarantees and Odra's developer ergonomics make contract development first-class.
- **Finality guarantees:** Casper's consensus finality means a recorded receipt is final. No reorg risk — critical for audit-grade records.
- **Gas-efficient hash storage:** Casper's named-key storage model stores hashes efficiently at ~3 CSPR per receipt. Hash-only privacy keeps costs predictable.

## What This Is (and Isn't)

**What it is:** A working demo that records agent decision receipts on Casper testnet. The live demo includes 7 verified on-chain receipts — the 6 seeds plus the hero, receipt #114 (Acme Cloud $8,500), each independently verifiable via Casper RPC. The public Workbench and Job Flow are read-only walkthroughs; live recording runs through a guarded backend signer. Verification reads Casper RPC transaction args directly.

**What it demonstrates:** That on-chain hash attestation provides tamper-evident proof of agent decisions, making disputes resolvable in seconds instead of weeks.

**What it is not:** A production-ready compliance system. The agents shown are deterministic demo policy agents with fixed rules, not frontier AI models. The system runs on testnet.

## License

MIT
