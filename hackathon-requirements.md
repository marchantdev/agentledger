# Casper Agentic Buildathon 2026 - Requirements Document

**Last updated:** 2026-06-18
**Source:** https://dorahacks.io/hackathon/casper-agentic-buildathon + FACT-LOCK.md (operator-pinned)

---

## 1. Event Overview

- **Name:** Casper Agentic Buildathon 2026 - Qualification Round
- **Organizer:** Casper Association (co-sponsored by Halborn Security)
- **Platform:** DoraHacks
- **Format:** Two-round: Qualification Round -> Final Round
- **Eligibility:** Solo allowed, global participation

## 2. Deadlines

| Milestone | Date |
|-----------|------|
| Submissions open | 2026-06-01 |
| **Qualification deadline** | **2026-06-30** (12 days from today) |
| Final Round | 2026-07-06 to 2026-07-19 |
| Winners announced | Late July 2026 |

**CRITICAL: 12 calendar days remaining.** Concept must be locked quickly.

## 3. Prize Structure (from FACT-LOCK.md - authoritative)

| Component | Amount | Notes |
|-----------|--------|-------|
| Cash prizes | $30,000 USD | Real cash |
| x402 ecosystem credits | $100,000 | NOT cash. Platform credits for x402 usage. |
| In-kind support | $20,000 | Technical/marketing support, NOT cash |
| **Total headline** | **$150,000** | **Only $30k is cash** |

**IMPORTANT:** Never describe this as "$150k cash." Only $30k is cash. Credits and in-kind are supplementary.

Prize distribution per track is not publicly detailed for the Agentic Buildathon. The previous Casper Hackathon 2026 (different event) distributed $25k as: 1st $10k, 2nd $7k, 3rd $3k, plus track prizes of $2.5k each.

## 4. Competition Tracks

Four tracks confirmed via press coverage:
1. **Agentic AI** - AI agents operating autonomously on Casper
2. **DeFi and Payments** - Financial applications, payment infrastructure
3. **Cross-Chain** - Interoperability solutions connecting Casper with other ecosystems
4. **RWA Tokenization** - Real-world asset tokenization

**No explicit requirement to pick one track** -- projects may span categories.

## 5. Submission Requirements (MANDATORY deliverables)

### 5.1 Working Prototype on Casper Testnet
- Must have a transaction-producing on-chain component
- Must demonstrate real testnet transactions (verifiable via explorer)
- This is the Builder Merit Path qualification gate

### 5.2 Open-Source GitHub Repository
- Must be publicly accessible (GitHub/GitLab/Bitbucket)
- Must include a README explaining the project

### 5.3 Demo Video
- Required as part of DoraHacks submission
- No specific length requirement found in public sources
- Should demonstrate the working product end-to-end
- Best practice from previous winners: 60-90 seconds showing problem -> solution -> demo -> impact

### 5.4 DoraHacks BUIDLs Submission
- Submit via DoraHacks platform (https://dorahacks.io/hackathon/casper-agentic-buildathon)
- Fields include: project description, GitHub link, demo video link, team info

## 6. Builder Merit Path (Qualification Mechanism)

**Qualifying != Winning Cash.** The Builder Merit Path is the gate to advance from Qualification Round to the jury-judged Final Round.

Requirements:
- Working prototype deployed on Casper **Testnet**
- Must include a transaction-producing on-chain component
- Verified via Casper testnet explorer (testnet.cspr.live)

Projects that qualify advance to the Final Round (July 6-19) where a jury evaluates them. Community voting also plays a role via CSPR.fans (on-chain voting for Sybil resistance via CSPR.vote).

## 7. Required Technologies

The Casper AI Toolkit is the expected technology stack:

### 7.1 Odra Framework (Smart Contracts)
- **Language:** Rust
- **Compile target:** WebAssembly (wasm32-unknown-unknown)
- **Version:** 2.8.0 (updated June 11, 2026)
- **Prerequisites:** Rust toolchain, wasmstrip (wabt), wasm-opt (binaryen)
- **Install:** `cargo install cargo-odra --locked`
- **New project:** `cargo odra new --name my-project`
- **Test:** `cargo odra test` (mock) or `cargo odra test -b casper` (CasperVM)
- **Has llms.txt support** for AI-assisted development

### 7.2 x402 Protocol (Micropayments)
- HTTP-native payment protocol for AI agent micropayments
- Agent calls paid endpoint -> receives 402 + price -> signs auth -> gets data
- Casper implementation: Go (47%) + TypeScript (45%)
- GitHub: https://github.com/make-software/casper-x402
- **Free x402 Facilitator usage** provided to hackathon participants
- Testnet facilitator: https://x402-facilitator.cspr.cloud
- Supported schemes: `exact` using CEP-18 tokens with EIP-712 signatures

### 7.3 MCP Server (Blockchain Interaction)
- 82 tools for blockchain queries (accounts, blocks, deploys, contracts, NFTs, transfers)
- Supports stdio (local) and HTTP (remote) modes
- GitHub: https://github.com/msanlisavas/casper-mcp
- Requires: CSPR.Cloud API key (from cspr.cloud)

### 7.4 CSPR.trade MCP Server (DEX Integration)
- Autonomous trading, swaps, liquidity management
- Access: https://mcp.cspr.trade

### 7.5 CSPR.click AI Agent Skill (Wallet Integration)
- Install: `claude skill install cspr-click`
- Provides: wallet ops, tx building/signing, CSPR.cloud API proxy, contract deployment
- Docs: https://docs.cspr.click/documentation/ai-agent-skills

### 7.6 CSPR.cloud Middleware (Enterprise APIs)
- REST API, Streaming API (SSE), Node API
- Install as AI Agent Skill: https://cspr.cloud/skill.md

### 7.7 casper-eip-712 (Typed Data Signing)
- Off-chain typed-data signing for meta-transactions
- GitHub: https://github.com/casper-ecosystem/casper-eip-712

## 8. Testnet Access

- **Faucet:** https://testnet.cspr.live/tools/faucet
- **Process:** Connect Casper Wallet (testnet mode) -> complete CAPTCHA -> request tokens
- **Limit:** 1000 CSPR per account, one request per account
- **Cost:** Free (no card, no mainnet funds needed)
- **Docker alternative:** Local NCTL node via casper-x402/infra/ Docker Compose
- **Explorer:** https://testnet.cspr.live

## 9. Judging Process

### Qualification Round (current phase)
- Builder Merit Path: working testnet prototype with on-chain tx
- Community voting via CSPR.fans (on-chain, Sybil-resistant via CSPR.vote)
- Casper Association retains discretion to advance additional high-impact teams

### Final Round (July 6-19)
- Jury-judged evaluation
- Specific judging criteria/weightings not publicly detailed for Agentic Buildathon
- Based on previous Casper hackathon patterns, likely factors:
  - Technical implementation quality
  - Innovation/creativity
  - Use of Casper-specific features (x402, MCP, Odra)
  - Potential impact/scalability
  - Demo quality and polish

## 10. Competition State

- **Current submissions:** ~40 BUIDLs from 278 hackers
- **Previous Casper Hackathon:** 450 signups, 117 qualifying projects, 45 to finals
- **Previous winners:** CasPay (payments), Shroud Protocol (privacy), CasperLink (cross-chain intent execution)

## 11. Hard Disqualifiers (inferred from rules + FACT-LOCK.md)

- No working testnet transaction = no qualification
- Closed-source repo = likely disqualified
- No demo video = incomplete submission
- Mainnet transactions are NOT required (testnet only)

## 12. Restrictions (from FACT-LOCK.md)

- NO mainnet transactions
- NO paid services or credit card usage
- NO submission by Aurora (Sam-manual only, separately gated)
- Day-1 M1 kill-gate: Must prove Odra/Rust contract compiles + real Casper testnet tx; failure = pivot to Superteam fallback

## 13. Key Documentation Links

| Resource | URL |
|----------|-----|
| DoraHacks page | https://dorahacks.io/hackathon/casper-agentic-buildathon |
| Casper AI Toolkit | https://www.casper.network/ai |
| Odra docs | https://odra.dev/docs/ |
| Odra llms.txt | https://odra.dev/llms.txt |
| x402 GitHub | https://github.com/make-software/casper-x402 |
| x402 Facilitator API | https://docs.cspr.cloud/x402-facilitator-api/reference |
| Casper MCP GitHub | https://github.com/msanlisavas/casper-mcp |
| CSPR.click Skills | https://docs.cspr.click/documentation/ai-agent-skills |
| CSPR.cloud | https://cspr.cloud |
| CSPR.trade MCP | https://mcp.cspr.trade |
| Testnet faucet | https://testnet.cspr.live/tools/faucet |
| Testnet explorer | https://testnet.cspr.live |
| Casper docs | https://docs.casper.network |
| EIP-712 signing | https://github.com/casper-ecosystem/casper-eip-712 |
| Previous hackathon winners | https://www.casper.network/news/casper-x-space-recap-feb-5-2026 |

## 14. SDK Maturity & Known Risks

| Component | Maturity | Risk |
|-----------|----------|------|
| Odra 2.8.0 | Active, docs updated June 2026 | **Rust is new for us.** Kill-gate M1 tests this. |
| x402 | Production on mainnet | Go + TS implementations available |
| Casper MCP | v3.0.0, community-built | 82 tools, well-documented |
| CSPR.click | Production | React, Next.js, Vanilla JS |
| CSPR.cloud | Enterprise-grade | REST + Streaming + Node API |
| Testnet | Stable, free faucet | 1000 CSPR limit per account |
