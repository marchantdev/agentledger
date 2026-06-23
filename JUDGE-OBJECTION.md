# AgentLedger — Judge Objection Sheet

Anticipating the hardest questions a judge might ask, and answering them honestly.

---

## "This is just a logging system. Why does it need blockchain?"

**Answer:** A centralized log doesn't help when the dispute is with the company that owns the log. A vendor challenging an autonomous agent's payment approval needs a record the agent operator *can't edit after the fact*. Blockchain provides tamper-evidence without requiring third-party arbitration. On-chain finality (Casper's deterministic consensus) means the receipt was recorded at a known time and cannot be altered. A SQL database with timestamps doesn't give you that — the database owner can update the timestamp too.

---

## "The agents are fake. They're deterministic scripts, not real AI."

**Answer:** Correct, and documented. The demo agents are deterministic policy evaluators — fixed rules, not language models. That's deliberate: the *record-keeping system* is the innovation, not the agent itself. AgentLedger works with any agent that can serialize its decision to JSON and call an API. The Odra SDK wrapper can be integrated into any agent system. The demo uses simple agents so judges can follow the logic step by step — the receipt mechanism is the same regardless of agent complexity.

---

## "The 'live demo' actually uses seeded receipts. Where's the real live recording?"

**Answer:** The Agent Workbench generates genuinely new on-chain transactions when the backend is active. The 6 seed receipts (decisions 0–5) are pre-recorded on Casper testnet and always available. When you click "Run" in the Workbench, a new transaction fires and a new receipt appears with a fresh tx hash — verifiable on the testnet explorer. The backend runs with a kill-switch (RECORDING_ENABLED=false by default), a global cap of 25 recordings, and per-session limits to protect testnet resources. If the backend is offline, the Workbench shows an amber "Read-Only Demo — Seeded Receipt" banner — it never silently pretends a seeded receipt is fresh.

---

## "Why Casper specifically? Couldn't this work on any EVM chain?"

**Answer:** Three reasons: (1) Casper's enterprise focus and finality guarantees match the target use case (high-stakes agent accountability in regulated industries). (2) Odra provides native Rust ergonomics for smart contracts — the DecisionRegistry is clean, typed, and deploys to WASM without EVM overhead. (3) Casper's named key storage makes contract state human-readable on the explorer — the `job_payment_ref_hash`, `input_hash`, etc. are visible as named args in every transaction, making the proof drawer self-explanatory to auditors. This isn't just "any chain with a hash function" — the presentation layer matters for the accountability use case.

---

## "What's the actual user journey? Who calls this?"

**Answer:** Target path: a company deploys an autonomous trading or treasury agent. The agent uses the AgentLedger SDK (npm package) to call `attest(decision)` after each action. The attestation is stored on Casper. When a dispute arises — vendor claims the agent approved $15K, company says $10K — either party fetches the on-chain receipt, re-hashes the original data, and gets a binary VERIFIED/TAMPERED result in seconds. No arbitrator needed. The demo's Payment Dispute Case File walks through this exact scenario in 5 guided steps.

---

## "Is the contract production-ready? Has it been audited?"

**Answer:** No — this is a hackathon demo, and we say so. The contract is deployed on Casper testnet, not mainnet. It has not been security-audited. The backend signing key is scoped to testnet. The smart contract logic is intentionally minimal (hash storage + retrieval) to reduce attack surface, but minimal ≠ audited. A production deployment would require a formal audit, mainnet deployment, and key management infrastructure beyond the scope of a 7-day buildathon.

---

## "What's the market? Who pays for this?"

**Answer:** Enterprise AI teams deploying autonomous agents in regulated contexts (fintech, asset management, compliance). The EU AI Act mandates explainability for high-risk AI systems — verifiable decision logs are one path to compliance. The revenue model: SaaS per-attestation pricing for API access, or self-hosted SDK + consulting for larger teams. The immediate wedge is any company already using autonomous agents that faced a disputed decision and had no verifiable audit trail. That's a known pain point with a clear before/after.

---

## "This looks like it could be built in a week. Is there defensibility?"

**Answer:** The *pattern* (hash + chain) takes an afternoon. The defensibility is in: (1) SDK integrations (connecting to 10+ agent frameworks), (2) the job/payment reference binding model (tying receipts to specific work orders), (3) the dispute resolution workflow (5-phase guided flow), and (4) the enterprise trust layer (SLAs, key management, audit report formats). In a week, we built the core proof. The 6-month version is an integration network. The first 1,000 agents that get their decisions attested on AgentLedger create a network effect — their counterparties expect receipts.

---

## "What's not working or not complete?"

**Answer:** Being direct: the live recording backend is not publicly deployed — it runs locally and requires a HTTPS tunnel during the demo window. The proof drawer currently shows some fields from local receipt metadata rather than exclusively from on-chain RPC parse (V3 fix in progress). The x402 integration is copy — no real x402 settlement flow exists. The demo agents are deterministic scripts with 3 fixed rule sets, not configurable or extensible. These are clear hackathon limitations. The core proof — Casper contract, client-side verification, tamper detection, receipt display — is complete and live.
