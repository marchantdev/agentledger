# AgentLedger Demo Video — Production Script v4 (Live Writable + Agent Trace)

## Target: 87 seconds | Voice: ElevenLabs Daniel (Steady Broadcaster)
## Audio generated: scene1-7 clips in demo-assets/ (86.4s total)

**NOTE:** This script assumes W1 (live writable endpoint) is deployed. If W1 is not live at video production time, replace Scene 3 with the seeded receipt flow from v3.

---

### SCENE 1: Problem (0:00–0:07) [7.5s audio]
**Visual:** Black screen. White text fades in line by line.
**Audio:** demo-assets/scene1_problem.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| AI agents approve payments. Execute trades. But when something goes wrong — there's no proof. | A-I agents approve payments and execute trades. But when something goes wrong, there's no proof. |

---

### SCENE 2: Solution + Landing (0:07–0:14) [7.0s audio]
**Visual:** AgentLedger landing page. Hero text: "Verifiable receipts for the agent economy."
**Audio:** demo-assets/scene2_solution.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| AgentLedger — Verifiable receipts for the agent economy | Agent Ledger. Tamper-proof receipts on Casper. If an agent gets paid, it leaves a receipt. |

---

### SCENE 3: Agent Workbench — LIVE Recording (0:14–0:34) [19.9s audio — HIGHLIGHT]
**Visual:** Navigate to /workbench. Three scenario cards. Click "Vendor Payment." Agent trace animation:
- Step 1: "Reading invoice facts" → animated check
- Step 2: "Checking vendor trust score" → check
- Step 3: "Evaluating budget threshold" → check
- Step 4: "Decision: APPROVE ($10,000)" → green badge
- Step 5: "Recording on Casper..." → pending spinner → confirmed with block number
**Audio:** demo-assets/scene3_workbench.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| Live Workbench: agent evaluates rules step by step, records on Casper | The Agent Workbench. Pick a scenario: vendor payment. Watch the agent evaluate: read invoice, check trust score, apply budget rules. Decision: approve ten thousand dollars. Hash recorded on Casper testnet. Every step visible. |

---

### SCENE 4: Receipt + Casper Proof (0:34–0:53) [18.7s audio]
**Visual:** Click receipt link. Receipt page: agent ID, action, job payment ref hash, green "Verified from Casper RPC" badge. Expand "Raw Casper Proof Data" drawer — tx hash, block height, named args.
**Audio:** demo-assets/scene4_receipt.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| On-chain receipt: payment ref hash, Casper proof drawer, R-P-C verified | The on-chain receipt. Agent, action, and job payment reference hash, all verified. Expand the Casper proof drawer: transaction hash, block height, named arguments from the smart contract. Verified client-side against Casper R-P-C. |

---

### SCENE 5: Tamper Detection (0:53–1:07) [13.8s audio — KILLER MOMENT]
**Visual:** On receipt page, click "Try Tampering." Amount changes $10K→$15K. Red TAMPERED banner. Hash mismatch shown.
**Audio:** demo-assets/scene5_tamper.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| Change the amount. The hash breaks instantly. | Try tampering. Change the amount from ten thousand to fifteen thousand. Re-hash against the chain. Instantly: tampered. The hash mismatch proves what the agent originally decided. |

---

### SCENE 6: Dispute Case File (1:07–1:20) [13.1s audio]
**Visual:** Navigate to /dispute. Walkthrough phases:
Phase 1: "CloudServ Inc claims $15,000" → Phase 2: On-chain shows $10,000 → Phase 3: Hash mismatch → Phase 4: "Disproved"
**Audio:** demo-assets/scene6_dispute.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| Payment dispute resolved in seconds, not weeks | A vendor claims fifteen thousand dollars. The dispute case file shows the agent approved ten thousand. Hash mismatch. Disproved by cryptographic evidence. Seconds, not weeks. |

---

### SCENE 7: Close (1:20–1:27) [6.4s audio]
**Visual:** Landing page with stats. Text overlay: "Built on Casper."
**Audio:** demo-assets/scene7_close.mp3

| Display Text | Phonetic Voiceover |
|---|---|
| Agent Ledger. Built on Casper. | Agent Ledger. Verifiable receipts for the agent economy. Built on Casper. |

---

## Screenshot Sequence (for Playwright capture)

1. `00_title.png` — Black screen with problem text (ffmpeg text overlay)
2. `01_landing.png` — Landing page hero
3. `02_workbench_cards.png` — Workbench with 3 scenario cards
4. `03_workbench_trace.png` — Agent trace animation mid-evaluation
5. `04_workbench_confirmed.png` — Recording confirmed with block number
6. `05_receipt_verified.png` — Receipt page with green Verified badge
7. `06_receipt_proof.png` — Casper proof drawer expanded
8. `07_receipt_tampered.png` — Red TAMPERED banner with hash mismatch
9. `08_dispute_claim.png` — Dispute case file: vendor claim
10. `09_dispute_verdict.png` — Dispute verdict: disproved
11. `10_close.png` — Landing page with stats

## Video Production Notes

- **Voice:** ElevenLabs Daniel (onwK4e9ZLuTAKqWW03F9), Steady Broadcaster
- **Model:** eleven_flash_v2_5
- **Transitions:** Crossfade (0.5s) between scenes. NO white flashes.
- **Resolution:** 1920x1080
- **Duration target:** 87 seconds (scene audio: 86.4s + transitions)
- **Key timing:** Scene 3 (workbench trace) gets 19.9s — this is the money shot
- **Audio sync:** Voiceover says "approve ten thousand dollars" exactly when the green APPROVE badge appears
- **Dispute scene:** Fast-paced — show the 5 phases in 14 seconds, focus on the verdict

## Fallback (if W1 not live)
If the writable endpoint isn't deployed, Scene 3 changes to:
- Show seeded decisions on dashboard instead of live recording
- Voiceover: "Here are real agent decisions already on Casper testnet" instead of "Watch the treasury agent work"
- Skip the live recording animation, show existing receipt directly
- Everything else stays the same
