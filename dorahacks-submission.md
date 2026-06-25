# DoraHacks BUIDL Submission — AgentLedger

## Project Name
AgentLedger

## Tagline
If an agent gets paid, it leaves a receipt — tamper-proof, on Casper, verifiable by anyone.

## Short Description (for BUIDL card)
AgentLedger records tamper-evident decision receipts for AI agents on Casper. When an agent approves a payment, executes a trade, or flags a risk, AgentLedger hashes the decision data and stores it on-chain via an Odra smart contract. Anyone can verify receipts haven't been tampered with by recomputing hashes against the on-chain attestation. Hash-only storage — audit-ready evidence with privacy.

## Long Description

### The Problem
AI agents are going from assistants to autonomous workers — executing trades, approving payments, managing treasuries. But when something goes wrong, there's no verifiable proof of what an agent actually decided. Disputes take weeks to resolve because there's no tamper-evident audit trail.

### The Solution
AgentLedger creates verifiable receipts for every agent decision. Each receipt binds the agent's decision to a payment/job reference hash, stored on Casper's blockchain. The on-chain record is immutable — if someone claims the agent approved $15,000 but the receipt shows $8,500, the hash mismatch proves it in seconds.

### How It Works
1. Agent makes a decision (approve payment, execute trade, flag risk)
2. Input data, output data, and payment/job reference are SHA-256 hashed
3. Hashes are submitted to the DecisionRegistry contract on Casper testnet
4. Anyone can verify: re-hash the original data → compare to on-chain → match = verified, mismatch = tampered

### Key Features
- **Agent Workbench (read-only walkthrough)** — Run demo policy agent scenarios (vendor payment, DeFi swap, risk alert). A deterministic policy agent evaluates rules step by step, then opens the verified on-chain receipt. The public demo includes 7 verified receipts (6 seeds + the hero #119, Northwind Cloud $8,500); live recording runs through a guarded backend signer (not the public demo).
- **Paid Agent Job Flow** — Guided 6-phase end-to-end walkthrough: job created → policy agent evaluates inputs → decision recorded on Casper → receipt bound to job/payment ref → payer verifies → dispute/tamper fails. Turns "attestation demo" into "the trust layer for paid agents."
- **Tamper Detection** — Edit any decision field, re-verify against chain, see instant TAMPERED/VERIFIED result. The on-chain hash is the source of truth.
- **Payment Dispute Demo** — Guided walkthrough: vendor claims $15K approved, on-chain proves $10K. Dispute resolved cryptographically.
- **Enterprise Audit Packet** — Download a comprehensive proof document per receipt: receipt JSON, input/output hashes, job/payment ref hash, Casper tx hash, contract/package hash, block height, verification result, tamper result, with markdown explanation. Designed for "send this to your auditor."
- **Casper Proof Drawer** — On-chain transaction data (named args, block height, contract package) fetched directly from Casper RPC — no backend trust required. Clearly labels local receipt metadata vs chain-verified hashes.
- **x402-Ready Payment Binding** — Each receipt's job_payment_ref_hash binds the decision to a specific payment/job reference. The verifier confirms the receipt corresponds to the stated payment. Ready for x402 micropayment integration.
- **Agent Policy Trace** — Visible rule evaluation steps showing how the demo policy agent reached its decision.

> **Honest demo note:** The demo policy agents are deterministic rule-evaluators, not frontier LLMs. Recording runs through a guarded backend signer (time-limited, per-session caps, kill-switch) — designed for hackathon demo safety, not production scale; the public demo is read-only. Verification always runs client-side against Casper RPC.

### Tech Stack
- **Smart Contract:** Odra 2.8.0 (Rust) — DecisionRegistry: record_decision, get_decision, get_total_decisions
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS, deployed on Vercel
- **Verification:** Client-side SHA-256 (canonical JSON) + Casper RPC via Edge Function proxy — no backend trust required
- **Live recording backend:** Express.js + casper-client CLI — submits to Casper testnet, gated by kill-switch + global cap
- **On-chain:** Casper testnet, 7 verified receipts (6 seeds + the hero #119), all verifiable via Casper RPC
- **Tests:** 31 backend tests (verify integrity, injection resistance, safeguard enforcement)

### Why Casper
- **Institutional trust:** Casper targets enterprise and regulated industries — exactly where AI agent accountability matters most
- **Finality guarantees:** No reorg risk. A recorded receipt is final.
- **Odra framework:** Native Rust contracts with developer-friendly ergonomics
- **x402 alignment:** AgentLedger complements x402 micropayments — every paid agent action gets a receipt

## Track
Agentic AI

## GitHub
https://github.com/marchantdev/agentledger

## Demo
https://frontend-beige-zeta-86.vercel.app

## Demo Video
53-second walkthrough: value prop → verified receipt #119 (Northwind Cloud $8,500, Casper-RPC-verified) → tamper mismatch → verification. https://youtu.be/-MnSxaIxAAo

## Contract
- Package: hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb
- Contract: contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a
- Network: Casper Testnet (casper-test)
- Explorer: https://testnet.cspr.live/contract/contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a

## Verified Transactions
- Decision 0: https://testnet.cspr.live/transaction/33d0c30518c49eee0d1da80d6002020e54aff02b12b7a899e36e1b25b7dc90de
- Decision 1: https://testnet.cspr.live/transaction/dc6d937f77d868999d80200bd214d4c67470e4ccbfee9cdc64366b7e29e7d3ef
- Decision 2: https://testnet.cspr.live/transaction/68fb33abbf3f61564bc5f36ea73665d1dc1cfca9986cd7d35a92c4eca8742483
- Decision 3: https://testnet.cspr.live/transaction/bd9165f409b6a4e81dfc602f0369e402aa5e8d00d4aff2c21858b6bb88ab47dc
- Decision 4: https://testnet.cspr.live/transaction/a8553b3715a3947147e7f36863e0d25db920507369e4972aee4dee7e56fb757e
- Decision 5: https://testnet.cspr.live/transaction/fdfd7b9cbe52109e0d62a008018ea45fbfdd1f56c4682d46c50a3fa9b8f3340a
