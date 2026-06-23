# AgentLedger — Architecture

## Thesis
"If an agent gets paid, it leaves a receipt."

AgentLedger = verifiable receipts for AI agents performing paid work. A lightweight Odra registry binding agent action, input/output hashes, timestamp, and job/payment reference into a public testnet proof. The audit/settlement layer for pay-per-result AI agents.

## Honest Differentiation
- vs EAS: EAS = generic attestation substrate; AgentLedger = Casper/x402-flavored product flow for agent work receipts
- vs zkML: zkML proves computation/inference; AgentLedger proves OPERATIONAL accountability (what an agent claimed, when, under which job/payment context)
- vs papers: shippable demo, not research infra

## Tech Stack
- **Smart Contract:** Odra 2.8.0 (Rust) on Casper testnet — DEPLOYED
- **Backend:** Express.js (thin API: record + query + verify)
- **Frontend:** React + Vite + Tailwind (protocol mode) — DEPLOYED on Vercel
- **Testnet RPC:** https://node.testnet.casper.network/rpc (Casper 2.0 API)

## Scope Cap (FACT-LOCK mandated)
- ONE contract (DecisionRegistry) — DEPLOYED
- ONE backend path (Express API)
- ONE dashboard (React)
- ONE verifier (tamper detection)
- ONE great video
- x402 LIGHT (job/receipt reference only, not deep integration)
- NO compliance engine, NO PII, NO raw decisions on-chain, NO deep MCP/CSPR.click/CSPR.cloud

## Components

### 1. Odra Smart Contract (Rust) — DEPLOYED
- Contract package: `hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb`
- Contract hash: `contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a`
- Entry points:
  - `record_decision(agent_id, action_class, input_hash, output_hash, job_payment_ref_hash) -> u64`
  - `get_decision(id) -> DecisionRecord`
  - `get_total_decisions() -> u64`
  - `get_agent_decision_count(agent_id) -> u64`
- Account: `016e802ff29d677cf426fbb1ad98b26ac35fa659d8afd8d690ea62ac433a3ceb96`

### 2. Backend API (Express.js)
- `POST /api/record` — hashes input/output, calls contract `record_decision`, returns tx hash
- `GET /api/decisions` — queries contract for decision list
- `GET /api/decisions/:id` — get single decision
- `POST /api/verify` — accepts original data + decision_id, recomputes hash, compares to on-chain
- Uses casper-client CLI or casper-js-sdk for chain interaction

### 3. Frontend (React) — DEPLOYED on Vercel
- **Landing:** "If an agent gets paid, it leaves a receipt" positioning
- **Dashboard:** Decision timeline with agent filter, explorer links, job/payment refs
- **Record:** Interactive demo — agent submits decision, see receipt
- **Verify:** KILLER DEMO — paste decision text, hash it, compare to on-chain, MATCH/MISMATCH
  - Demo moment: edit text, verification FAILS: "This result does not match the on-chain attestation"

## Data Flow

```
Agent performs work -> Backend hashes input/output -> Backend calls record_decision on contract
                                                         |
Frontend queries decisions <- Contract stores hash receipt (agent_id, hashes, job_ref, timestamp)
                                                         |
Verifier: original text -> SHA-256 -> compare to on-chain hash -> MATCH or TAMPERED
```

## Feature Budget (max 3)

| Feature | Description | Demo-visible | Status |
|---------|------------|-------------|--------|
| Decision Registry | Record + query agent decision receipts on-chain | Yes: dashboard timeline | Contract DEPLOYED, frontend mock |
| Tamper Verifier | Compare original data hash to on-chain hash | Yes: verify page | Planned |
| Job/Payment Ref | Link decisions to paid work (x402 reference) | Yes: receipt shows job ref | Contract field added |

## Key Design Decisions
- Hash-only on-chain (not raw data) — privacy + gas efficiency
- `job_payment_ref_hash` — connects decision to paid work without exposing payment details
- Testnet only — no mainnet needed for qualification
- Verifier compares client-side SHA-256 to on-chain hash — simple but powerful demo moment
- Express backend as thin bridge — could be replaced with direct client-side casper-js-sdk later
