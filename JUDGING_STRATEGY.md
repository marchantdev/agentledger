# Judging Strategy — AgentLedger

## Judging Criteria (inferred from Casper hackathon patterns)

| Criterion | Weight | Our Target | Strategy |
|-----------|--------|------------|----------|
| Technical Implementation | 25% | 9/10 | Clean Odra contract (hash registry). Real testnet deploys. TypeScript SDK with working attestation flow. |
| Innovation/Creativity | 25% | 10/10 | Only project addressing agent accountability. Novel across ALL chains. Reframes the hackathon question. |
| Casper Platform Integration | 25% | 9/10 | All 5 toolkit components: Odra (contract), x402 (pay-per-attestation), MCP (chain queries), CSPR.click (wallet), CSPR.cloud (streaming). |
| Impact/Scalability | 15% | 9/10 | EU AI Act regulatory angle. Every agent on every chain needs audit trails. |
| Demo Quality | 10% | 8/10 | Clear problem-solution-demo-impact narrative. Concrete scenario: trading agent attests decision, hash verified on-chain. |

## Per-Criterion Optimization

### Technical Implementation (25%)
- Must show: Compiled Odra WASM, deployed to testnet, real record_decision() transaction
- Bonus: get_decisions() query returning structured data, SDK wrapping a real agent flow
- Risk: Rust compile errors. Mitigation: M1 spike validates this Day 1.

### Innovation (25%)
- Must show: This is the ONLY attestation project. Judges see 40 submissions.
- Pitch: Everyone builds agent capabilities. Nobody builds agent accountability.
- Key phrase: A flight recorder for the agent economy.

### Platform Integration (25%)
- Odra: Core contract with named keys for agent decision storage.
- x402: Each attestation costs a micropayment. Revenue model.
- MCP: Query chain for attestation history.
- CSPR.click: Wallet connection in dashboard.
- CSPR.cloud: SSE streaming for real-time decision feed.

### Impact (15%)
- Regulatory: EU AI Act Article 14 requires human oversight and logging.
- Market: AI agent market projected 7B by 2030 (Gartner).
- Casper positioning: Manifest roadmap targets regulated assets.

### Demo Quality (10%)
- 60-90 seconds
- Structure: Problem (10s) then Solution (10s) then Live Demo (45s) then Impact (10s)
- Must show REAL testnet transaction in explorer

## Previous Winner Analysis

| Winner | What they built | What we learn |
|--------|----------------|---------------|
| CasPay (1st) | Payment infrastructure | Infra projects win. We are infra. |
| Shroud (2nd) | Privacy layer | Novel angle wins. We have novel angle. |
| CasperLink (3rd, solo) | Cross-chain intent execution | Deep toolkit integration matters. |


## Overall Score Target
- Technical: 9/10 (score via working testnet contract + SDK)
- Innovation: 10/10 (score via novel category + zero competitors)
- Platform Integration: 9/10 (score via all 5 Casper toolkit components)
- Impact: 9/10 (score via EU AI Act alignment + market sizing)
- Demo Quality: 8/10 (score via problem-solution-demo-impact narrative)
- Total weighted score target: 9.15/10
