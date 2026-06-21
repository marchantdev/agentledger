# AgentLedger Demo Video — Production Script v2

## Target: 75 seconds | Voice: ElevenLabs Daniel (Steady Broadcaster)

---

### SCENE 1: Problem (0:00–0:08)
**Visual:** Black screen → white text fades in: "AI agents handle millions in transactions." Then: "Nobody can prove what they decided."

| Display Text | Phonetic Voiceover |
|---|---|
| AI agents handle millions in transactions. Nobody can prove what they decided. | A-I agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there's no proof of what actually happened. |

---

### SCENE 2: Solution (0:08–0:18)
**Visual:** AgentLedger landing page loads. Hero text visible.

| Display Text | Phonetic Voiceover |
|---|---|
| AgentLedger — Verifiable receipts for the agent economy | Agent Ledger. Every agent decision gets a tamper-proof hash on Casper. If an agent gets paid, it leaves a receipt. |

---

### SCENE 3: Dashboard (0:18–0:30)
**Visual:** Dashboard page. 6 decisions visible with agent filter pills. Click to expand one — show agent ID, action class, tx hash. Click explorer link.

| Display Text | Phonetic Voiceover |
|---|---|
| 6 decisions from 4 agents, all on Casper testnet | Here's the dashboard. Six agent decisions from four different agents, each recorded on Casper testnet. Every receipt shows the agent, the action, and a link to the on-chain transaction. |

---

### SCENE 4: Guided Demo — Verification PASS (0:30–0:45)
**Visual:** Navigate to Verify page. Click "Try the Guided Demo" button. The demo auto-loads decision zero (treasury agent vendor payment approval). Data populates in textareas. Verify runs automatically. Green VERIFIED result appears.

| Display Text | Phonetic Voiceover |
|---|---|
| Guided Demo: Step 1 — Verify original data | Now the key feature. Click the guided demo button. It loads a treasury agent's payment approval with the original data, and verifies it against the on-chain hash. Both hashes match. This decision is verified. |

---

### SCENE 5: Guided Demo — Tamper Detection FAIL (0:45–1:00) [KILLER MOMENT]
**Visual:** The demo auto-tampers the output data — changes the payment amount. Red "modified" badge appears. Textarea gets red border. Re-verification runs. Red TAMPERED result with hash mismatch.

| Display Text | Phonetic Voiceover |
|---|---|
| Step 2 — Tamper the data. The hash breaks instantly. | Now watch. The demo tampers the payment amount in the output data. The modified badge appears. It re-verifies — and the hash breaks instantly. Tamper detected. The on-chain receipt proves exactly what the agent originally decided. The ledger never lies. |

---

### SCENE 6: Explorer Proof (1:00–1:08)
**Visual:** Click explorer link from dashboard. Show testnet dot cspr dot live with the real transaction hash and block number.

| Display Text | Phonetic Voiceover |
|---|---|
| Real transactions on Casper testnet — anyone can verify | Every receipt links directly to the Casper block explorer. Real transactions on testnet. Cryptographic proof anyone can verify independently. |

---

### SCENE 7: Close (1:08–1:15)
**Visual:** Landing page. Stats section shows 6 decisions, 4 agents. GitHub link visible. "Built for the Casper Agentic Buildathon 2026."

| Display Text | Phonetic Voiceover |
|---|---|
| AgentLedger — Built on Casper. Open source. | Agent Ledger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub. |

---

## Screenshot Sequence (for Playwright capture)

1. `01_problem.png` — Black screen with problem text (create in ffmpeg)
2. `02_landing.png` — Landing page hero
3. `03_dashboard.png` — Dashboard with 6 decisions
4. `04_dashboard_expanded.png` — One decision expanded
5. `05_verify_start.png` — Verify page with "Try the Guided Demo" button
6. `06_verify_pass.png` — Green VERIFIED result
7. `07_verify_tampered.png` — Red border, modified badge, data changed
8. `08_verify_fail.png` — Red TAMPERED result
9. `09_explorer.png` — Casper explorer transaction
10. `10_close.png` — Landing page stats + footer

## Video Production Notes

- **Voice:** ElevenLabs Daniel (onwK4e9ZLuTAKqWW03F9), Steady Broadcaster
- **Model:** eleven_flash_v2_5
- **Transitions:** Simple crossfade (0.5s) between scenes
- **Resolution:** 1920x1080
- **Duration target:** 75 seconds (max 90)
- **No white flashes** — crossfade or hard cut only
