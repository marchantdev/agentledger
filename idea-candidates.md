# Idea Candidates — Casper Agentic Buildathon 2026

**Hackathon:** Casper Agentic Buildathon 2026 (Qualification Round)
**Generated:** 2026-06-18
**Landscape research completed:** yes (hackathon-landscape.md)
**Deadline:** 2026-06-30 (12 days)
**Decisive constraint:** Odra/Rust contracts (no prior experience). M1 kill-gate Day 1.

---

## Candidate 1: AgentLedger — Verifiable Agent Decision Attestation
**Category:** AI x Crypto
**One-sentence pitch:** Every AI agent decision — trades, payments, deployments — gets an immutable on-chain proof on Casper so institutions can audit exactly what agents did and why.

| Criterion | Score (0-3) | Evidence |
|-----------|-------------|----------|
| **Real Problem** | 2 | EU AI Act requires explainability for high-risk AI. Enterprises deploying agents need audit trails for compliance, liability, and insurance. No existing chain offers agent-specific attestation. |
| **Timing** | 3 | EU AI Act enforcement 2025-26. MiCA regulates crypto agents. Casper Manifest targets regulated/institutional users. "Agent accountability" is next wave after "agent capability." |
| **Buildable** | 3 | Odra contract is a simple hash registry (store decision_hash + metadata + timestamp). No complex DeFi logic. Off-chain agent logic in TypeScript. MCP for chain queries. x402 for pay-per-attestation. CSPR.click for wallet. All 5 toolkit components used naturally. |
| **Sponsor-Aligned** | 3 | Agentic AI track (primary). Aligns with Casper's thesis: regulated assets + machine economy. Demonstrates x402 + MCP + Odra + CSPR.click + CSPR.cloud. Validates Casper Association's strategic vision. |
| **Differentiated** | 3 | Zero hackathon submissions do this (40 BUIDLs all focused on trading/payments/bridges). No existing solution on any chain. Novel even outside Casper. |
| **Founder Insight** | 3 | "AI agents don't need more capabilities — they need accountability. Trust is the missing infrastructure between agent autonomy and institutional adoption." Reframes hackathon from "what can agents do" to "why should anyone trust them." |
| **Judge Excitement** | 2 | Strong concept but abstract. Demo must be concrete: Agent makes trade -> reasoning + outcome attested on-chain -> auditor verifies via explorer. Risk: if demo isn't crisp, concept gets lost. |
| **Expansion Potential** | 3 | Attestation registry -> compliance infrastructure -> enterprise agent governance platform -> "the audit layer for the agent economy." |
| **TOTAL** | **22/24** | |

---

## Candidate 2: CompliAgent — Compliance-First Agent for Regulated Operations
**Category:** DeFi / Infra
**One-sentence pitch:** An AI agent that checks KYC whitelists, transfer limits, and regulatory rules on-chain before executing any transaction — the first agent that won't break the law.

| Criterion | Score (0-3) | Evidence |
|-----------|-------------|----------|
| **Real Problem** | 2 | Institutions won't use autonomous agents without compliance guarantees. Every DeFi agent today operates without regulatory checks. |
| **Timing** | 3 | MiCA live. Casper's ERC-3643-inspired security token standard targets this. Regulatory pressure creating demand. |
| **Buildable** | 2 | Odra contract: whitelist registry + transfer gate. More complex than hash store — needs conditional logic. Risk: Rust complexity escalates with conditional logic. |
| **Sponsor-Aligned** | 3 | Casper Manifest explicit: regulated assets + compliance are their differentiator vs Solana/ETH. Uses all toolkit components. |
| **Differentiated** | 3 | Zero hackathon teams think about compliance. Solana/ETH hackathons never produce compliance-aware agents. Unique by default. |
| **Founder Insight** | 2 | "Compliance isn't a feature to bolt on later — it must be the first instruction an agent receives." Decent but not deeply surprising. |
| **Judge Excitement** | 2 | Important but not viscerally exciting. Compliance makes bank executives nod, not lean forward. Showing "blocked transfer" is less exciting than "successful attestation." |
| **Expansion Potential** | 2 | Compliance framework -> regulated DeFi middleware -> institutional onboarding layer. |
| **TOTAL** | **19/24** | |

---

## Candidate 3: PayGate — x402 Agent Service Marketplace
**Category:** Payments / UX
**One-sentence pitch:** The "Shopify for AI agent APIs" — agents register services, set prices, and earn CSPR via x402 micropayments, turning every agent into a business.

| Criterion | Score (0-3) | Evidence |
|-----------|-------------|----------|
| **Real Problem** | 2 | Everyone uses x402 to PAY. Nobody builds infrastructure for agents to EARN. Supply side of agent economy is empty. |
| **Timing** | 2 | x402 just launched on Casper. Agent-to-agent commerce is theoretical. Right for hackathon context but market is pre-PMF. |
| **Buildable** | 2 | Odra contract: service registry. Medium complexity. Frontend: marketplace UI. x402 for payments. MCP for discovery. |
| **Sponsor-Aligned** | 3 | x402 is Casper's flagship tech. Using both buy-side AND sell-side deeply showcases its potential. |
| **Differentiated** | 2 | Several teams likely building x402 payment gateways (landscape Tier 2). Marketplace is more differentiated but "agent payments" space will be crowded. |
| **Founder Insight** | 2 | "The agent economy has consumers but no producers." Reasonable but marketplace-as-insight is well-trodden. |
| **Judge Excitement** | 2 | Marketplaces are familiar. "Another marketplace" risk. Demo: Agent A publishes service -> Agent B pays via x402 -> settlement on Casper. |
| **Expansion Potential** | 3 | Service registry -> agent economy platform -> "AWS for AI agents on Casper." |
| **TOTAL** | **18/24** | |

---

## Candidate 4: AgentPay — Pay-Per-Result AI Services
**Category:** Consumer
**One-sentence pitch:** An AI assistant where you only pay when it delivers results you approve — x402 micropayments for verified outcomes, not attempts.

| Criterion | Score (0-3) | Evidence |
|-----------|-------------|----------|
| **Real Problem** | 3 | AI subscription fatigue is real. Users pay $20-200/month for variable quality. Pay-per-result aligns incentives. Relatable to anyone who's paid for mediocre AI outputs. |
| **Timing** | 2 | Subscription models dominate AI. Shift to usage-based happening but pay-per-RESULT with verification is new. Good timing but no specific trigger event. |
| **Buildable** | 2 | Odra contract: escrow (PENDING -> DELIVERED -> APPROVED/DISPUTED). Off-chain: agent that performs tasks. x402 for payment flow. Risk: quality verification is subjective. |
| **Sponsor-Aligned** | 3 | x402 is the payment mechanism. Agentic AI track. Uses Odra + x402 + MCP + CSPR.click. |
| **Differentiated** | 2 | Pay-per-use exists (API pricing). Novelty is on-chain escrow with user approval. Some teams may build similar payment flows. |
| **Founder Insight** | 2 | "Stop paying for AI attempts. Pay for AI results." Catchy, immediately understood, but more slogan than deep insight. |
| **Judge Excitement** | 3 | Immediately relatable. Every judge has paid for disappointing AI. "Only pay when it works" makes people lean forward. Clear before/after demo. |
| **Expansion Potential** | 2 | Pay-per-result -> quality marketplace -> trust layer for AI services. Good but constrained to payments vertical. |
| **TOTAL** | **19/24** | |

---

## Candidate 5: AgentGuard — Smart Contract Security Auditor
**Category:** Dev Tooling
**One-sentence pitch:** Upload your Odra smart contract, get an AI-powered security audit with findings attested on-chain — pay per audit via x402.

| Criterion | Score (0-3) | Evidence |
|-----------|-------------|----------|
| **Real Problem** | 2 | Smart contract vulnerabilities cause billions in losses. Odra/Casper contracts are new and under-audited. But ecosystem has very few contracts — small addressable market. |
| **Timing** | 2 | Odra 2.8.0 just updated. New contracts being written. But Odra ecosystem is tiny — not enough contracts for a thriving audit tool. |
| **Buildable** | 3 | Odra contract: simple audit report registry. Off-chain: AI analysis of Rust code (our strongest skill). x402 for payment. Extremely comfortable territory. |
| **Sponsor-Aligned** | 2 | Dev Tooling uses Odra. But less "agentic" than other ideas. Judges may see this as a tool, not an agent. |
| **Differentiated** | 2 | AI audit tools exist for Solidity. Novel for Odra/Casper but small market. |
| **Founder Insight** | 1 | "AI finds bugs in smart contracts" — not novel. Everyone knows this is possible. |
| **Judge Excitement** | 2 | Security is important but not exciting. "AI finds a bug" demo is hard to make visually compelling. |
| **Expansion Potential** | 2 | Audit tool -> security platform -> DevSecOps for Casper. Limited by ecosystem size. |
| **TOTAL** | **16/24** | |

---

## Candidate 6: AgentDAO — Autonomous Agent Collective Governance
**Category:** Consumer / Governance
**One-sentence pitch:** Multiple AI agents pool funds, propose actions, vote, and execute collectively — a DAO where the members are agents, not humans.

| Criterion | Score (0-3) | Evidence |
|-----------|-------------|----------|
| **Real Problem** | 1 | Multi-agent governance is theoretical. Nobody has this pain point today. Research concept, not market need. |
| **Timing** | 1 | DAOs exist but agent-DAOs are speculative. No triggering event. |
| **Buildable** | 2 | Odra contract: proposal + voting (well-known DAO patterns). Off-chain: agents propose and vote. The interesting part (why they'd govern collectively) is hard to demo. |
| **Sponsor-Aligned** | 2 | Agentic AI track, but governance is tangential to x402/payments/compliance focus. |
| **Differentiated** | 2 | Agent-DAOs haven't been built. But "DAO but with AI" doesn't reframe the problem. |
| **Founder Insight** | 2 | "Agents need governance, not just commands." Interesting but theoretical. |
| **Judge Excitement** | 1 | "Agents that vote" sounds novel for 5 seconds, then "why?" Hard to create compelling demo moment. |
| **Expansion Potential** | 2 | Agent governance -> autonomous organizations -> new coordination primitive. No near-term market. |
| **TOTAL** | **13/24** | |

---

## Category Diversity Check
- [x] Consumer: AgentPay (#4), AgentDAO (#6)
- [x] Dev Tooling: AgentGuard (#5)
- [x] DeFi / Infra: CompliAgent (#2)
- [x] AI x Crypto: AgentLedger (#1)
- [x] Payments / UX: PayGate (#3)
- [x] **At least 3 categories covered?** YES (5 categories)

## Prize Track Strategy
**Primary track:** Agentic AI
**Secondary track:** DeFi and Payments (if top idea has payment components)

## Top 3 Recommendation

### 1. AgentLedger (22/24) — RECOMMENDED
**Why this wins:** Only idea that reframes the hackathon. While 40+ teams build "what agents DO," AgentLedger asks "why should anyone TRUST what agents do." Aligns with Casper's regulated/institutional positioning. Simple Odra contract (hash registry — survivable for Rust learning curve). Uses all 5 toolkit components naturally. Zero competitors in attestation space.

### 2. AgentPay (19/24) — Strong alternative
**Why this wins:** Immediately relatable. Every judge has paid for AI that underdelivered. "Only pay for results" lands in 5 seconds. x402 escrow is a natural fit. More consumer-friendly than AgentLedger but less strategically aligned with Casper's positioning.

### 3. CompliAgent (19/24) — Casper-aligned but harder to demo
**Why this wins:** Directly validates Casper's strategic thesis. Compliance is their moat vs Solana/ETH. Zero hackathon teams think about compliance. But harder to demo excitingly — "blocked transfer" is less compelling than "attestation recorded."

## Kill List

### Killed: AgentGuard (16/24)
**Why this loses:** Tiny addressable market (few Odra contracts exist). "AI audits contracts" is not novel. Less "agentic" — judges see a tool, not an autonomous agent.

### Killed: AgentDAO (13/24)
**Why this loses:** Theoretical problem with no current users. Demo fails "why should I care?" test. No triggering event. "DAO but with AI" is a wrapper, not a reframe.

---

## Anti-Pattern Check (all NO for top 3)
- [x] NO: Not "another DEX/AMM"
- [x] NO: Not a "dashboard for X"
- [x] NO: Not an "AI wrapper around existing tool"
- [x] NO: Not "infrastructure nobody asked for" (EU AI Act creating demand)
- [x] NO: Not "technically impressive but no user need"
- [x] NO: No behavior change required (agents attest automatically)
- [x] NO: No network effects dependency (works with 1 agent)
- [x] NO: Not "cool tech demo, unclear user" (user = enterprises deploying AI agents)

## What 10 Other Teams Will Build
1. DeFi dashboard with AI chat (10+ teams)
2. DEX swap bot (8+ teams — CSPR.trade already does this)
3. NFT minting agent (5+ teams)
4. Token launcher clone (3+ teams — CSPR.fun exists)
5. Payment gateway (5+ teams — CasPay pattern)
6. Cross-chain bridge agent (3+ teams)
7. Smart contract generator (5+ teams — Odra llms.txt)
8. Yield optimizer (3+ teams)
9. Agentic escrow/invoicing (3+ teams)
10. RWA tokenization platform (2+ teams)

**None address agent accountability, compliance, or decision attestation.**
