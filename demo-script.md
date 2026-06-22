# AgentLedger Demo Video — Production Script v3 (Receipt-Loop Flow)

## Target: 80 seconds | Voice: ElevenLabs Daniel (Steady Broadcaster)

---

### SCENE 1: Problem (0:00–0:08)
**Visual:** Black screen → white text fades in: "AI agents handle millions in transactions." Then: "Nobody can prove what they decided."

| Display Text | Phonetic Voiceover |
|---|---|
| AI agents handle millions in transactions. Nobody can prove what they decided. | A-I agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there's no proof of what actually happened. |

---

### SCENE 2: Solution (0:08–0:16)
**Visual:** AgentLedger landing page loads. Hero text visible. Value props visible.

| Display Text | Phonetic Voiceover |
|---|---|
| AgentLedger — Verifiable receipts for the agent economy | Agent Ledger. Every agent decision gets a tamper-proof receipt on Casper, bound to a payment or job reference hash. If an agent gets paid, it leaves a receipt. |

---

### SCENE 3: Dashboard (0:16–0:26)
**Visual:** Dashboard page. Stats cards (On-Chain Receipts, Confirmed, Active Agents, Latest Block). Decision timeline with 4 agents. Click one to show details.

| Display Text | Phonetic Voiceover |
|---|---|
| Real metrics: 8 decisions from 4 agents, all on Casper testnet | Here's the dashboard. Eight agent decisions from four different agents, each recorded on Casper testnet. Real metrics — on-chain receipts, confirmation count, and the latest Casper block number. |

---

### SCENE 4: Receipt Page (0:26–0:38)
**Visual:** Click a decision to navigate to /receipt/:id. Show: agent ID, action class, job payment ref hash, input/output hashes, Casper TX hash, block height. Green "Verified from Casper RPC" badge. QR code visible.

| Display Text | Phonetic Voiceover |
|---|---|
| Shareable receipt: verified from Casper R-P-C, with job reference hash | Click any decision to see its on-chain receipt. Every field is here: the agent, the action, the job payment reference hash, and the Casper transaction. The verification badge confirms the hashes match the on-chain data in real time. Each receipt is shareable with a Q-R code. |

---

### SCENE 5: Tamper Detection (0:38–0:52) [KILLER MOMENT]
**Visual:** On Receipt page, click "Try Tampering". The output data gets modified (payment amount changes). Red TAMPERED banner appears. Hash mismatch shown.

| Display Text | Phonetic Voiceover |
|---|---|
| Tamper the data. The hash breaks instantly. | Now watch. Click try tampering. The system modifies the payment amount in the output data. It re-verifies against the on-chain hash, and the receipt instantly shows TAMPERED. The hash mismatch proves exactly what the agent originally decided. The ledger never lies. |

---

### SCENE 6: Agent Workbench (0:52–1:05)
**Visual:** Navigate to Workbench page. Three scenario cards visible. Select "Vendor Payment". Agent decides. Pending → Confirmed animation. Receipt link appears.

| Display Text | Phonetic Voiceover |
|---|---|
| Live Workbench: run an agent scenario, get a receipt on Casper | The Agent Workbench lets you try it live. Pick a scenario — vendor payment, defi swap, or risk alert. The agent makes a decision, records the hash on Casper testnet, and you get a verifiable receipt. Every recording is rate-limited and balance-protected. |

---

### SCENE 7: Audit Export + Close (1:05–1:18)
**Visual:** Back on receipt page. Click "Export Markdown" button. Download starts. Then show landing page with stats. "Built for the Casper Agentic Buildathon 2026."

| Display Text | Phonetic Voiceover |
|---|---|
| Audit-ready exports. Built on Casper. Open source. | Every receipt can be exported as an audit-ready report — Markdown or J-SON, with chain verification status and a privacy note that no raw data is stored on chain. Agent Ledger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub. |

---

## Screenshot Sequence (for Playwright capture)

1. `01_problem.png` — Black screen with problem text (create in ffmpeg)
2. `02_landing.png` — Landing page hero with value props
3. `03_dashboard.png` — Dashboard with stats cards + decision timeline
4. `04_receipt.png` — Receipt page with green verification badge + QR
5. `05_receipt_tampered.png` — Receipt page with red TAMPERED banner
6. `06_workbench.png` — Workbench page with 3 scenario cards
7. `07_workbench_recording.png` — Workbench recording in progress (pending → confirmed)
8. `08_audit_export.png` — Receipt page showing export buttons
9. `09_close.png` — Landing page stats + footer

## Video Production Notes

- **Voice:** ElevenLabs Daniel (onwK4e9ZLuTAKqWW03F9), Steady Broadcaster
- **Model:** eleven_flash_v2_5
- **Transitions:** Simple crossfade (0.5s) between scenes
- **Resolution:** 1920x1080
- **Duration target:** 80 seconds (max 90)
- **No white flashes** — crossfade or hard cut only
