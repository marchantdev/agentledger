# CASPER AGENTIC BUILDATHON — FACT-LOCK (operator-pinned, authoritative)
# These corrected facts OVERRIDE any prior/memory claims. Do not rely on memory.

- Event: Casper Agentic Buildathon 2026 — Qualification Round (Casper Association + DoraHacks).
- Rules URL: https://dorahacks.io/hackathon/casper-agentic-buildathon
- QUALIFICATION deadline: 2026-06-30. Final Round: 2026-07-06 .. 2026-07-19. Winners: late July.
- Eligibility: SOLO allowed, GLOBAL.
- PRIZE: $30,000 CASH + $100,000 x402 ecosystem CREDITS + $20,000 in-kind. CASH = $30k.
  ** Credits and in-kind are NOT cash. Never describe the prize as "$150k cash". **
- Qualification ("Builder Merit Path"): working prototype on Casper TESTNET with a transaction-producing
  on-chain component -> advances to JURY-judged Final Round. ** QUALIFYING != WINNING CASH. **
- Submission: working Casper Testnet prototype w/ on-chain tx + open-source GitHub repo (README) + demo video.
- Tech: Casper AI Toolkit — Odra (RUST smart contracts), x402, MCP, CSPR.cloud, CSPR.click.
  Testnet is FREE via faucet (no card, no mainnet funds). Docker local testnet is a fallback.
- DECISIVE RISK: Odra/Casper smart contracts are RUST (new language for us). Day-1 M1 kill-gate tests this.
- FALLBACK: Superteam "Solana AI Kit agent skills" bounty (3000 USDG, deadline 2026-07-01) if Casper M1 fails.
- HARD GATES: (1) DISCOVERY -> SELECTION -> creator .idea-approved BEFORE any EXECUTION/build.
  (2) M1 Day-1 vertical slice = compiling Odra contract + real Casper testnet tx + verifiable explorer artifact
      tied to THIS project; Claude verifies independently; ambiguous = STOP -> pivot Superteam.
- PROHIBITED: no submission, no mainnet tx, no paid service, no card, no C3, no Phase 1.5, no bounty pipeline.
  Submission is Sam-manual + separately gated only after final packet approval.

## BUILD SCOPE-CAP (Codex-mandated for AgentLedger — do NOT exceed)
- MVP = verifiable decision ATTESTATION ONLY.
- On-chain stores ONLY hashes/attestations: decision_hash, agent_id, action_class, timestamp, (optional) metadata_hash.
- NO compliance engine. NO sensitive/raw decision text on-chain. NO PII. NO broad policy/regulatory framework.
- Odra contract stays a SIMPLE hash registry (DecisionRegistry) — no complex DeFi/conditional logic (keeps M1 Rust risk low).
- M1 FIRST = compile Odra + ONE real Casper testnet tx + verifiable explorer artifact, then STOP for Claude/Codex verification.
- No implementation beyond scaffold before .idea-approved; no wallet/testnet tx, public repo push, or submission before the M1 checkpoint.
- Submission is Sam-manual only. Testnet only; no mainnet, no paid services.


## REFINED THESIS — Codex "would this win" review (CLEAR_WITH_LIMITS, 2026-06-19)
VERDICT: continue AgentLedger but NOT as-is. Current thesis likely QUALIFIES, probably does NOT win $30k.
Do a NARRATIVE/PRODUCT pivot (NOT a full switch to AgentPay — that wastes the proven M1).

**NEW POSITIONING:** "Verifiable receipts for AI agents performing PAID work." AgentLedger = the
audit/settlement layer for pay-per-result AI agents (AgentLedger x AgentPay). Tagline: **"If an agent gets
paid, it leaves a receipt."**

**KILL these claims (false/unverifiable):** "first on-chain AI attestation", "novel across all chains",
"zero competitors on any chain", "0 of 40 BUIDLs". (EAS already does on-chain agent attestations; zkML
EZKL/zkPyTorch exist; Ethereum agent-registration arXiv work exists. The novelty line must die.)

**HONEST DIFFERENTIATION:** "Casper-native agent accountability receipts: a lightweight Odra registry binding
agent action, input/output hashes, timestamp, and optional payment/job reference into a public testnet proof."
- vs EAS: EAS = generic attestation substrate; AgentLedger = Casper/x402-flavored product flow for agent work receipts.
- vs zkML: zkML proves computation/inference; AgentLedger proves OPERATIONAL accountability (what an agent claimed, when, under which job/payment context).
- vs papers: shippable demo, not research infra.

**CONTRACT (stays tiny):** record_decision(agent_id, action_class, input_hash, output_hash, job_payment_ref_hash)
+ query/view. NO compliance engine, NO raw decisions, NO PII, NO policy framework.

**WIN-MAXIMIZING SCOPE (cut hard):** ONE contract, ONE backend path, ONE dashboard, ONE verifier, ONE great
video. x402 LIGHT (a job/receipt reference is enough; do NOT let x402 consume the build). DROP deep
MCP / CSPR.click / CSPR.cloud / TS-SDK integrations — use only what makes the 90-second demo credible.

**KILLER DEMO (make judges FEEL it):** an autonomous treasury agent approves/rejects a vendor payment -> UI
"Verify this decision" -> shows input hash, output hash, agent ID, action class, Casper tx hash, timestamp ->
demo edits the local decision text -> verification FAILS: "This result does not match the on-chain attestation."

**FRONTEND:** rework the existing Vercel frontend to THIS (receipts-for-paid-work + tamper-detection verifier).
Do NOT harden the abstract-compliance version.

**TOP 3:** (1) delete all false-novelty claims -> Casper-native/x402-ready/operational-receipt positioning;
(2) hybridize with AgentPay (paid agent work becoming verifiable); (3) cut scope hard (one contract, one
backend, one dashboard, one verifier, one great video). Refs: https://odra.dev/docs/ , https://arxiv.org/abs/2604.22652

