# AgentLedger Demo Video — Production Script

## Target: 75 seconds | Voice: ElevenLabs (natural pace)

---

### SCENE 1: Problem (0:00–0:08)
**Visual:** Black screen. White text fades in: "AI agents handle millions in transactions."
Then: "Nobody can prove what they decided."

**Voiceover:**
> AI agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there's no proof of what actually happened.

---

### SCENE 2: Solution (0:08–0:18)
**Visual:** AgentLedger landing page loads. Hero text: "If an agent gets paid, it leaves a receipt."

**Voiceover:**
> AgentLedger. Every agent decision gets a tamper-proof hash on Casper. If an agent gets paid, it leaves a receipt.

---

### SCENE 3: Dashboard (0:18–0:28)
**Visual:** Dashboard page. 6 decisions visible. Click one to expand — show agent ID, action class, tx hash, block height. Click explorer link.

**Voiceover:**
> Here's the dashboard. Six agent decisions, each recorded on Casper testnet. Every receipt shows the agent, the action, and a link to the on-chain transaction.

---

### SCENE 4: Verification — PASS (0:28–0:40)
**Visual:** Navigate to Verify page. Select "treasury-agent-01 — vendor_payment_approval" from dropdown. Input and output data auto-populate. Click "Verify Against Chain".

**Result:** Green — VERIFIED. Both hashes match.

**Voiceover:**
> Now the key feature. Select a treasury agent's payment approval. The original input and output data are loaded. Click verify. Both hashes match the on-chain attestation. This decision is verified.

---

### SCENE 5: Tamper Detection — FAIL (0:40–0:55) [KILLER MOMENT]
**Visual:** In the input data textarea, change `"amount": 10000` to `"amount": 50000`. Click "Verify Against Chain" again.

**Result:** Red — TAMPERED. Input hash mismatch. Side-by-side hash comparison visible.

**Voiceover:**
> But what if someone changes the amount after the fact? Change ten thousand to fifty thousand and verify again. The hash breaks. Tamper detected. The on-chain receipt proves the original decision. The ledger never lies.

---

### SCENE 6: Explorer Proof (0:55–1:05)
**Visual:** Click the Casper explorer link from the verification result. Show testnet.cspr.live with the real transaction. Highlight block number, transaction hash.

**Voiceover:**
> Every receipt links directly to the Casper block explorer. Real transactions on testnet. Cryptographic proof anyone can verify independently.

---

### SCENE 7: Close (1:05–1:15)
**Visual:** Landing page stats section. GitHub link. "Built for the Casper Agentic Buildathon 2026."

**Voiceover:**
> AgentLedger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub.

---

## Screenshot Sequence (for Playwright capture)

1. Landing page hero (full viewport)
2. Dashboard with decisions list
3. Dashboard decision expanded (show tx hash, explorer link)
4. Verify page — decision selected, data loaded
5. Verify page — green VERIFIED result
6. Verify page — amount changed to 50000
7. Verify page — red TAMPERED result with hash comparison
8. Casper explorer showing real transaction
9. Landing page stats section + footer

## Video Production Notes

- **Voice:** ElevenLabs, male, natural pace, professional tone
- **Music:** Subtle ambient background, fade in/out
- **Transitions:** Simple fade/cut between scenes
- **Resolution:** 1920x1080
- **Text overlays:** Scene title cards at transitions
- **Duration target:** 75 seconds (max 90)
