# AgentLedger — DoraHacks BUIDL Submission Draft

**Hackathon:** Casper Agentic Buildathon 2026
**Track:** Agentic AI
**Submission platform:** DoraHacks BUIDLs

---

## 1. Project Name

AgentLedger

## 2. Tagline

Verifiable receipts for AI agents doing paid work — every decision bound to a payment/job reference hash on Casper.

## 3. Short Description (1 paragraph)

AgentLedger records tamper-evident decision receipts for AI agents on the Casper blockchain. When an agent makes a decision — approving a payment, executing a trade, flagging a risk — AgentLedger hashes the decision data and stores it on-chain via an Odra smart contract. Each receipt binds the agent's decision to a **payment/job reference hash**, linking what the agent decided to the work it was paid for. Verification runs client-side: recompute SHA-256 hashes and compare against on-chain transaction arguments via Casper RPC. If any field has been altered, verification fails instantly. The live demo includes 7 verified on-chain receipts (6 seeds from 4 agent types + the hero, receipt #114), each independently verifiable via Casper RPC. The public Workbench and Job Flow are read-only walkthroughs; live recording runs through a guarded backend signer. Hash-only storage means no raw data on-chain — audit-ready evidence with privacy.

## 4. Long Description (2-3 paragraphs)

AI agents are being deployed to manage assets, execute trades, and approve payments autonomously. But when something goes wrong — a disputed payment, a rogue trade, an audit — there is no tamper-proof record of what the agent decided. Traditional logs are centralized and editable. AgentLedger solves this with Casper-native decision receipts. Every agent decision is SHA-256 hashed (inputs, outputs, and job/payment context) and recorded on-chain via an Odra smart contract. The receipt is immutable — modify any field and the hash verification fails instantly. This creates an audit-ready evidence trail without exposing sensitive data on-chain.

The core of AgentLedger is a DecisionRegistry smart contract (Rust/Odra) deployed on Casper testnet, storing decision attestations with structured fields: agent_id, action_class, input_hash, output_hash, and job_payment_ref_hash. The React frontend provides five key experiences: (1) an **Agent Workbench** where users run demo policy agents and watch them evaluate rules step by step, then open the resulting verified on-chain receipt; (2) a **Paid Agent Job Flow** — a guided 6-phase end-to-end walkthrough showing the complete lifecycle from job creation through payment verification and dispute resolution; (3) a **Payment Dispute Case File** that walks through a realistic vendor dispute resolved using on-chain evidence; (4) a **Verify** page for interactive tamper detection; and (5) **Receipt pages** with agent policy traces, Casper proof drawers, enterprise audit packet export, and x402-ready payment binding. Six real decisions from four agent types (treasury, trading, risk, compliance) are recorded on Casper testnet across blocks 8256786–8256790, each verifiable via the testnet explorer.

The payment/job reference hash is the key differentiator. It ties each decision receipt to the specific job or payment the agent was fulfilling. Auditors can trace from a financial record to the exact on-chain proof of the agent's decision. AgentLedger positions Casper as the trust layer for autonomous AI work — not by building another agent capability, but by building the accountability infrastructure that every agent needs.

## 5. Problem Statement

AI agents now handle autonomous transactions — approving payments, executing trades, managing portfolios. But when a decision is disputed, there is no tamper-proof record of what the agent decided, what data it used, or when it acted. Traditional logging is centralized and editable. Existing blockchain solutions focus on agent capabilities (trading, swaps, DeFi), not agent accountability. The result: institutions cannot audit autonomous agents reliably. Without verifiable records, disputes require expensive forensics and trust assumptions.

## 6. Solution

AgentLedger provides tamper-evident decision receipts for AI agents on Casper. Every agent decision is SHA-256 hashed and recorded on-chain via an Odra smart contract. The receipt is immutable — modify any field and hash verification fails instantly. This works with any agent performing any task: trading agents, compliance agents, treasury agents, risk monitors.

Key capabilities:
- **Agent Workbench** — Run demo policy agents with visible step-by-step rule evaluation, then see decisions recorded on-chain
- **Paid Agent Job Flow** — Guided 6-phase end-to-end walkthrough: job created → agent evaluates → decision recorded → receipt bound to payment ref → payer verifies → dispute resolved. The complete paid-agent story.
- **Receipts** — Shareable pages with chain verification badge, agent policy trace, Casper proof drawer, tamper demo, QR code, and enterprise audit packet export
- **Payment Dispute Demo** — Guided 5-phase walkthrough: vendor claims $15K, on-chain record proves $10K, hash mismatch disproves the claim
- **Enterprise Audit Packet** — Download comprehensive per-receipt proof: decision JSON, all hashes, Casper tx hash, block height, contract package, verification + tamper results, markdown explanation
- **Verify** — Select any decision, edit data, and watch tamper detection in real time
- **x402-Ready Payment Binding** — Each receipt binds to a job/payment reference hash, ready for x402 micropayment integration

All verification runs client-side via Casper RPC. The on-chain data is the source of truth, not a backend.

## 7. Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Smart Contract | Odra 2.8.0 (Rust) on Casper testnet | DecisionRegistry — stores decision hashes on-chain |
| Verification | Client-side SHA-256 + Casper RPC via Edge proxy | Browser-native hash comparison against on-chain transaction args |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS | Workbench, dispute demo, verify page, receipt pages, dashboard |
| Hashing | SHA-256 (canonical JSON serialization) | Tamper-evident fingerprinting of decision inputs/outputs |
| Backend (recording) | Express.js + casper-client CLI | Submits new decisions on-chain (recording mode) |

## 8. How Casper Is Used

AgentLedger is Casper-native by design — not a chain-agnostic tool ported to Casper:

- **Odra Framework (Rust):** The DecisionRegistry smart contract is written in Rust using Odra 2.8.0, compiled to WASM, and deployed on Casper testnet. It stores decision attestations with structured fields (agent_id, action_class, input_hash, output_hash, job_payment_ref_hash, timestamp) using Odra's named key storage.

- **Casper Testnet (live transactions):** 6 recorded decisions produce real on-chain transactions verifiable via the testnet explorer (blocks 8256786–8256790). The contract is deployed at `contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a`. Live recording runs through a guarded backend signer (time-limited, per-session caps); the public demo is read-only.

- **Client-side RPC verification:** Verification reads transaction arguments directly from Casper RPC via a thin Edge Function proxy (CORS). The on-chain data is authoritative — no backend trust required.

- **Institutional fit:** Casper targets enterprise and regulated industries. Agents operating in finance and operations need audit-ready evidence on infrastructure institutions can trust. AgentLedger's receipt exports (Markdown + JSON) are designed for audit workflows.

- **Finality guarantees:** Casper's consensus finality means a recorded receipt is final — critical for audit-grade records.

Gas-efficient: ~3 CSPR per receipt. Hash-only privacy — no raw prompts or output data on-chain.

## 9. Links

| Resource | URL |
|----------|-----|
| GitHub Repository | https://github.com/marchantdev/agentledger |
| Live Demo | https://frontend-beige-zeta-86.vercel.app |
| Demo Video | ~40-second tight cut — value prop → verified receipt #114 (Acme Cloud $8,500, Casper-RPC-verified) → tamper mismatch → verification. Hosted URL inserted at submission. |
| Contract on Testnet | https://testnet.cspr.live/contract/contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a |

## 10. Team

**Solo developer.** Background in autonomous AI systems, security research, and smart contract development. Previously placed 2nd in the Solana Graveyard Hackathon ($10,000) and has active security findings on huntr.com and MSRC. AgentLedger was built from the conviction that the agent economy's missing layer is not better capabilities — it is proof of correct behavior.

---

## What This Demo Does (honest summary for submission)

- Demo receipts recorded on Casper testnet via a guarded backend signer; public demo is read-only
- **6 seed receipts** included from 4 agent types (treasury, trading, risk, compliance)
- Verified on-chain receipts including the judge-verifiable hero #114; the public **Agent Workbench** is a read-only walkthrough (demo policy agents with visible rule evaluation)
- Verification reads **Casper RPC transaction args** directly (client-side, no backend trust)
- **Payment Dispute Case File** demonstrates why on-chain receipts matter (guided 5-phase walkthrough)
- Agents shown are **deterministic demo policy agents** with fixed rules — not frontier LLMs
- System runs on **Casper testnet** — this is a hackathon demo, not production infrastructure

---

## Field-by-Field Guide for DoraHacks Form

| DoraHacks Field | Source Section |
|-----------------|---------------|
| Project Name | Section 1: "AgentLedger" |
| Tagline / One-liner | Section 2 |
| Short Description | Section 3 (copy the full paragraph) |
| Long Description / Details | Section 4 (copy all paragraphs) |
| Problem | Section 5 |
| Solution | Section 6 |
| Tech Stack | Section 7 |
| How Casper is used | Section 8 |
| GitHub URL | Section 9 |
| Demo URL | Section 9 (Live Demo link) |
| Video URL | ⟨insert hosted/DoraHacks video URL at submission⟩ |
| Team Members | Section 10 |
| Track | Agentic AI |
