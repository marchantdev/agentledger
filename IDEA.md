# AgentLedger — On-Chain Agent Decision Attestation

## Concept
AgentLedger is a Casper smart contract + SDK that gives every AI agent decision an immutable on-chain proof. When an agent makes a decision (trade, transfer, analysis), it calls record_decision() to store a cryptographic hash of the decision context on Casper. Any third party can then verify the agent decision trail — like a flight recorder for the agent economy.

## Differentiation

### What Makes This Different
1. Accountability, not capability. While other submissions build agent capabilities (trading, DeFi, tools), AgentLedger builds agent accountability — the missing trust layer for paid agent work.
2. Casper-native agent accountability receipts. EAS exists for generic attestations; zkML proves inference. AgentLedger is purpose-built for operational accountability — what an agent claimed, when, under which job/payment context.
3. Regulatory tailwind. EU AI Act mandates explainability for high-risk AI.
4. Works WITH every other project. Composable attestation layer.

### What We Deliberately Did NOT Build
- Not a trading bot — we do not compete with CSPR.trade
- Not a compliance enforcer — we record proof, not enforce rules
- Not an agent marketplace — trust layer, not transaction layer

## Core Features (3 max)

| # | Feature | Demo Step |
|---|---------|-----------|
| 1 | Odra smart contract: record_decision() + get_decisions() | Agent attests decision, hash appears on-chain |
| 2 | TypeScript SDK with attestation hooks | Agent calls attest(), testnet tx fires |
| 3 | Dashboard: decision timeline with explorer links | Visual timeline of agent decisions |

## Tech Stack
- Smart Contract: Odra (Rust) on Casper testnet
- SDK: TypeScript
- Dashboard: React + CSPR.click + CSPR.cloud
- Payments: x402 micropayment per attestation
- Chain Queries: Casper MCP server

## Score: 22/24


## Target User
Primary: Enterprise compliance teams deploying AI agents for asset management, trading, or operational tasks. They need audit trails, regulatory reporting, and proof of correct operation.

Secondary: AI agent developers who want their agents to be trusted by institutional clients. AgentLedger is the credibility layer turning a hobby agent into an enterprise-ready service.
