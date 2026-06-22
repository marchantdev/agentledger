# AgentLedger — DoraHacks BUIDL Submission Draft

**Hackathon:** Casper Agentic Buildathon 2026
**Track:** Agentic AI
**Submission platform:** DoraHacks BUIDLs

---

## 1. Project Name

AgentLedger

## 2. Tagline

Verifiable receipts for autonomous AI agents on Casper — every decision bound to a payment/job reference hash.

## 3. Short Description (1 paragraph)

AgentLedger is an on-chain decision attestation layer for AI agents built on Casper. Every time an autonomous agent makes a decision — approving a payment, executing a trade, flagging a risk — AgentLedger records a tamper-proof cryptographic receipt on Casper testnet. Each receipt binds the agent's decision to a **payment/job reference hash**, linking what the agent decided to the work it was paid for. Input, output, and job reference are SHA-256 hashed and submitted via an Odra smart contract, creating an audit-ready trail. Anyone can verify decision integrity by recomputing hashes and comparing them to the on-chain attestation. If a single field has been altered, the verification fails instantly. AgentLedger is a flight recorder for the agent economy: agents who can prove they acted correctly on the job they were paid for.

## 4. Long Description (2-3 paragraphs)

AI agents are being deployed to manage assets, execute trades, and make operational decisions autonomously. But there is no infrastructure for verifying the decisions they made or the reasoning behind them. When something goes wrong — a rogue trade, a disputed approval, a compliance audit — there is no tamper-proof record of what the agent actually decided. AgentLedger solves this by turning every agent decision into a verifiable on-chain receipt on Casper. The system records cryptographic hashes of decision inputs (what the agent saw), outputs (what the agent decided), and job references (why the agent acted), without exposing raw data on-chain. This hash-only approach provides full auditability with privacy and gas efficiency.

The core of AgentLedger is a DecisionRegistry smart contract written in Rust using the Odra framework, deployed on Casper testnet. The contract exposes four entry points: `record_decision` stores a new attestation with agent ID, action class, input hash, output hash, and job/payment reference hash. `get_decision`, `get_total_decisions`, and `get_agent_decision_count` provide query access. A backend API (Express.js) serves as a thin bridge between agents and the contract, handling SHA-256 hashing and transaction submission via `casper-client`. The React frontend provides a decision timeline dashboard, an interactive recording interface, and — critically — a tamper verification page where users can modify any field of a recorded decision and watch the hash comparison fail in real time. Six real decisions from four different agents (treasury, trading, risk, compliance) are recorded on-chain across Casper testnet blocks 8256786-8256790, all verifiable via the testnet explorer.

The regulatory tailwind is real: the EU AI Act (enforcement 2025-26) mandates explainability and accountability for high-risk AI systems. Every enterprise deploying AI agents for financial operations will need exactly this kind of audit trail. AgentLedger positions Casper as the trust layer for autonomous AI — not by building another agent capability, but by building the accountability infrastructure that every agent needs.

## 5. Problem Statement

AI agents now handle millions in autonomous transactions — approving payments, executing trades, managing portfolios. But when a decision is disputed, there is no tamper-proof record of what the agent decided, what data it used, or when it acted. Traditional logging is centralized and editable. Existing blockchain solutions focus on agent capabilities (trading, swaps, DeFi), not agent accountability. The result: institutions cannot trust autonomous agents with real money because they cannot audit them. As the EU AI Act begins enforcement, this gap becomes a regulatory liability, not just a trust problem.

## 6. Solution

AgentLedger provides tamper-proof decision receipts for AI agents on Casper. Every agent decision is SHA-256 hashed (inputs, outputs, and job context) and recorded on-chain via an Odra smart contract. The receipt is immutable — modify any field and the hash verification fails instantly. This creates a complete, auditable decision trail without exposing sensitive data on-chain. The system works with any agent performing any task: trading agents, compliance agents, treasury agents, risk monitors. One contract, one hash per decision, one verifiable receipt.

Key capabilities:
- **Record:** Agents call `record_decision` to attest any decision on Casper testnet
- **Receipts:** Shareable `/receipt/:id` pages with chain verification badge, QR code, and audit-ready export (Markdown/JSON)
- **Workbench:** Live Agent Workbench with fixed vendor-payment/DeFi/risk scenarios, rate-limited and balance-protected for safe public access
- **Verify:** Interactive tamper detection — modify any field and watch the hash comparison break in real time
- **Prove:** All transactions publicly verifiable on the Casper testnet explorer

## 7. Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Smart Contract | Odra 2.8.0 (Rust) on Casper testnet | DecisionRegistry — stores decision hashes on-chain |
| Chain Interaction | casper-client CLI | Submits transactions and queries contract state |
| Backend API | Express.js (Node.js) | Thin bridge: hashes data, calls contract, serves queries |
| Frontend | React + Vite + TypeScript + Tailwind CSS | Dashboard, record interface, tamper verification page |
| Hashing | SHA-256 | Tamper-proof fingerprinting of decision inputs/outputs |
| Verification | Casper testnet RPC | Compares client-side hashes to on-chain attestation data |

## 8. How Casper Is Used

AgentLedger is Casper-native by design — not a chain-agnostic tool ported to Casper:

- **Odra Framework (Rust):** The DecisionRegistry smart contract is written in Rust using Odra 2.8.0, compiled to WASM, and deployed on Casper testnet. It stores decision attestations with structured fields (agent_id, action_class, input_hash, output_hash, job_payment_ref_hash, timestamp) using Odra's named key storage. This is a native Odra contract, not a Solidity port.

- **Casper Testnet (live transactions):** All 6+ recorded decisions produce real on-chain transactions verifiable via the testnet explorer (blocks 8256786-8256790+). The contract is deployed at `contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a`. The live Agent Workbench lets users trigger new on-chain recordings in real time.

- **casper-client CLI:** The backend uses `casper-client put-transaction` to submit `record_decision` calls. Verification reads transaction args directly from Casper RPC — the on-chain data is authoritative, not the local store.

- **Institutional fit:** Casper targets enterprise and regulated industries. Agent accountability fits this thesis directly — financial institutions deploying AI agents need audit trails on infrastructure they can trust. AgentLedger's audit-ready receipt exports (Markdown + JSON) are designed for compliance workflows.

- **Finality guarantees:** Casper's consensus finality means a recorded receipt is final. No reorg risk — critical for audit-grade records.

The hash-only approach keeps gas costs minimal (~3 CSPR per receipt) while providing full auditability. No raw prompts or output data are stored on-chain.

## 9. Links

| Resource | URL |
|----------|-----|
| GitHub Repository | https://github.com/marchantdev/agentledger |
| Live Demo | https://trigger-spring-blair-refer.trycloudflare.com |
| Demo Video | https://github.com/marchantdev/agentledger/blob/master/demo-assets/agentledger_demo.mp4 |
| Contract on Testnet | https://testnet.cspr.live/contract/contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a |

## 10. Team

**Solo developer.** Background in autonomous AI systems, security research, and smart contract development. Previously placed 2nd in the Solana Graveyard Hackathon ($10,000) and has active security findings on huntr.com and MSRC. AgentLedger was built from the conviction that the agent economy's missing layer is not better capabilities — it is proof of correct behavior.

---

## Field-by-Field Guide for DoraHacks Form

Use the sections above to fill in the DoraHacks BUIDL submission form:

| DoraHacks Field | Source Section |
|-----------------|---------------|
| Project Name | Section 1: "AgentLedger" |
| Tagline / One-liner | Section 2 |
| Short Description | Section 3 (copy the full paragraph) |
| Long Description / Details | Section 4 (copy all three paragraphs) |
| Problem | Section 5 |
| Solution | Section 6 |
| Tech Stack | Section 7 |
| How [blockchain] is used | Section 8 |
| GitHub URL | Section 9 |
| Demo URL | Section 9 (Live Demo link) |
| Video URL | Section 9 (Demo Video link) |
| Team Members | Section 10 |
| Track | Agentic AI |
