# AgentLedger Demo Video — Production Script v4 (Full Product Flow)

## Target: 80 seconds | Voice: ElevenLabs Daniel (Steady Broadcaster)

---

### SCENE 1: Problem (0:00–0:08)
**Visual:** Black screen → white text fades in: "AI agents handle millions in transactions." Then: "Nobody can prove what they decided."

| Display Text | Phonetic Voiceover |
|---|---|
| AI agents handle millions in transactions. Nobody can prove what they decided. | A-I agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there's no proof of what actually happened. |

---

### SCENE 2: Solution (0:08–0:15)
**Visual:** AgentLedger landing page loads. Hero text visible. Value props visible.

| Display Text | Phonetic Voiceover |
|---|---|
| AgentLedger — Verifiable receipts for the agent economy | Agent Ledger. Every agent decision gets a tamper-proof receipt on Casper, bound to a payment or job reference hash. |

---

### SCENE 3: Dashboard (0:15–0:23)
**Visual:** Dashboard page. Stats cards (On-Chain Receipts, Confirmed, Active Agents, Latest Block). Decision timeline with agents.

| Display Text | Phonetic Voiceover |
|---|---|
| Real metrics: 8 decisions from 4 agents, all on Casper testnet | The dashboard shows real agent decisions recorded on Casper testnet. On-chain receipts, confirmation count, and the latest Casper block number. |

---

### SCENE 4: Receipt + Audit Packet (0:23–0:36)
**Visual:** Click a decision → /receipt/:id. Show: agent ID, action class, job payment ref hash, input/output hashes, Casper TX hash, block height. Green "Verified" badge. Then show the Audit Packet download section — Markdown + JSON export buttons.

| Display Text | Phonetic Voiceover |
|---|---|
| On-chain receipt with downloadable enterprise Audit Packet | Click any decision to see its on-chain receipt. Every field: the agent, the action, the job payment reference hash, and the Casper transaction. Verification confirms the hashes match on-chain data in real time. Download a complete enterprise audit packet — Markdown or J-SON — with contract details, chain verification, and tamper test results. |

---

### SCENE 5: Tamper Detection (0:36–0:48) [KILLER MOMENT]
**Visual:** On Receipt page, click "Try Tampering". Output data modified. Red TAMPERED banner appears. Hash mismatch shown.

| Display Text | Phonetic Voiceover |
|---|---|
| Tamper the data. The hash breaks instantly. | Now watch. Click try tampering. The system modifies the payment amount. It re-verifies against the on-chain hash, and the receipt instantly shows TAMPERED. The hash mismatch proves exactly what the agent originally decided. The ledger never lies. |

---

### SCENE 6: Paid Agent Flow (0:48–1:02)
**Visual:** Navigate to /job-flow. Show the 6-phase guided flow: Job Brief card → Agent Evaluates → On-Chain Record (pending → confirmed) → Receipt bound to job → Verify step → Tamper test fails. Honest "demo policy agent" label visible.

| Display Text | Phonetic Voiceover |
|---|---|
| End-to-end: job created, agent decides, receipt on Casper, payer verifies | Here's the full flow. A job is created. The agent evaluates inputs against policy. The decision hash is recorded on Casper. A receipt is bound to the job reference. The payer verifies the receipt. And if anyone tampers with the data, the chain catches it. Every paid agent interaction leaves a verifiable trail. |

---

### SCENE 7: Why Casper + Close (1:02–1:18)
**Visual:** Show the Why Casper section on the Docs page — deterministic finality, tamper evidence, R-P-C verification, agent commerce. Then landing page with "Built for the Casper Agentic Buildathon 2026."

| Display Text | Phonetic Voiceover |
|---|---|
| Why Casper: deterministic finality, tamper-proof receipts, no backend trust needed | Why Casper? Deterministic finality means a receipt is final the moment it's confirmed — no probabilistic waiting. Verification runs directly against Casper R-P-C, no backend trust required. Agent Ledger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub. |

---

## Screenshot Sequence (for Playwright capture)

1. `01_problem.png` — Black screen with problem text (create in ffmpeg)
2. `02_landing.png` — Landing page hero with value props
3. `03_dashboard.png` — Dashboard with stats cards + decision timeline
4. `04_receipt.png` — Receipt page with green verification badge + audit packet download
5. `05_receipt_tampered.png` — Receipt page with red TAMPERED banner
6. `06_jobflow.png` — Job Flow page showing 6-phase guided flow
7. `07_jobflow_receipt.png` — Job Flow receipt step with verification
8. `08_why_casper.png` — Docs page Why Casper section
9. `09_close.png` — Landing page stats + buildathon credit

## Video Production Notes

- **Voice:** ElevenLabs Daniel (onwK4e9ZLuTAKqWW03F9), Steady Broadcaster
- **Model:** eleven_flash_v2_5
- **Transitions:** Simple crossfade (0.5s) between scenes
- **Resolution:** 1920x1080
- **Duration target:** 80 seconds (max 90)
- **No white flashes** — crossfade or hard cut only
