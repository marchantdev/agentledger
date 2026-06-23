# Decision Room — Casper Agentic Buildathon

**Date:** 2026-06-19
**Deadline:** 2026-06-30 (11 days remaining)
**Prize pool:** $30,000 USD (cash) + 1.5M CSPR community vote
**Decision:** AgentLedger — SELECTED

---

## The Three Concepts

## Candidate 1: AgentLedger — On-chain agent decision attestation registry

**What it is:** A Casper smart contract that AI agents call to record a cryptographic hash of each decision. Fields: agent_id, action_class, input_hash, output_hash, timestamp. A minimal off-chain SDK wraps the contract call. A read-only UI shows an agent decision trail.

**Why it wins:**
- Agentic AI is the hackathon theme — this IS the theme, not adjacent to it
- Casper account model (WASM, named keys, key management) is genuinely useful for agent identity
- Attestation is a real unsolved problem: enterprises have no tamper-proof audit trail for AI agents
- Demo is clear: run agent, log decision, query on-chain proof, show hash matches
- Minimal scope = shippable in 10 days with time for polish and video

**Risks:**
- Casper Odra SDK is Rust-based; compile + test cycle is slow
- If Casper testnet is flaky, demo breaks
- Attestation is abstract — demo must make it concrete

**Mitigations:**
- Start contract work Day 1, spike the full compile cycle before building features
- Record demo against local Docker testnet as fallback if public testnet is unreliable
- Demo scenario: trading agent decides to transfer funds, proof of that decision stored on-chain

**Fundability:** Strong. Regulatory pressure on AI accountability (EU AI Act, US EO 14110) makes audit trails a real enterprise need. Market exists post-hackathon.

**Score: 22/24**

---

## Candidate 2: AgentPay — Micropayment channel for AI agents

**What it is:** Casper contracts enabling one agent to pay another for a service (compute, data, API call) with CSPR micropayments. Agents negotiate, execute, and settle on-chain.

**Why it is interesting:**
- Agent-to-agent economy is a real concept
- Casper native token is CSPR — payment use case feels natural
- Would differentiate from typical AI agent logging projects

**Why it lost:**
- Requires TWO working agents interacting — doubles demo complexity and failure surface
- Payment channel logic (open/close/dispute) is non-trivial to build correctly in 10 days
- Judges scrutinise the economic model: what is the real adoption path?
- Teams built payment-adjacent projects in prior Casper hackathons — less differentiated than it looks
- Risk of becoming another DeFi project rather than an agentic AI project

**Fundability:** Medium. Agent payment rails exist (Solana Pay, ETH channels). Casper-specific version is a niche.

**Score: 19/24** — lost on Differentiation and Buildability

---

## Candidate 3: CompliAgent — AI agent that reads Casper contracts and flags compliance issues

**What it is:** An AI agent (Claude/GPT-backed) that ingests a deployed Casper contract WASM/ABI and generates a compliance report (access control, upgrade risk, fund drain vectors). Results stored on-chain.

**Why it is interesting:**
- Combines AI + smart contract analysis — clearly agentic AI
- Compliance/audit tooling has real enterprise buyers
- Storing findings on-chain is a natural Casper integration

**Why it lost:**
- The AI analysis step is off-chain, non-Casper; Casper becomes just a database
- Judges evaluating Casper network usage would score this low
- Existing tools (Slither, Mythril, Aderyn) already do contract analysis; the Casper-specific angle is thin
- Demo requires a target contract with real issues — manufactured, unconvincing
- Risk of AI hallucinating false positives in the compliance report

**Fundability:** Low. Security tooling market is crowded; Casper-specific version has tiny addressable market.

**Score: 19/24** — lost on Differentiation and Judge Excitement

---

## Decision: AgentLedger

**Rationale:**

AgentLedger is the clearest expression of the hackathon theme. The Casper Agentic Buildathon explicitly asks for AI agents interacting with Casper network — AgentLedger puts the agent decision-making itself on-chain, which is the most direct answer to the prompt.

The scope is intentionally narrow: **attestation only**. This means:
- ONE contract function: record_decision(agent_id, action_class, input_hash, output_hash)
- ONE query function: get_decisions(agent_id)
- ONE off-chain SDK method: attest(decision_data) -> contract call
- ONE UI view: decision timeline for a given agent

**What we are NOT building:**
- Agent execution engine (agents are simulated in the demo)
- Cross-agent communication
- Token rewards or staking
- Dispute resolution

**Demo scenario:** A trading agent decides to execute a swap. Before executing, it calls attest(). The hash of the decision is stored on Casper. A third party can then verify the agent made the decision it claimed — and that it was not altered after the fact.

**The $10M case:** Enterprises deploying AI agents in regulated industries (finance, healthcare, legal) need tamper-proof audit trails. AgentLedger is the first step toward that infrastructure on Casper.

---

## Scope Lock (attestation-only)

| In scope | Out of scope |
|----------|-------------|
| record_decision() contract function | Agent execution runtime |
| get_decisions() query | Cross-agent messaging |
| Off-chain SDK (JS/Python wrapper) | Token incentives |
| Read-only decision timeline UI | Dispute resolution |
| Demo with simulated trading agent | Real money / live trades |

Any scope expansion requires explicit creator approval.
