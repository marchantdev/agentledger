# AgentLedger — Demo Flow

## Video Target: 60-90 seconds

### Scene 1: The Problem (0:00-0:10)

**Display text:** AI agents handle millions in transactions. Nobody can prove what they decided or why.

**Phonetic voiceover:** A-I agents now handle millions in transactions. They approve payments, execute trades, and make decisions autonomously. But when something goes wrong, nobody can prove what the agent actually decided, or whether the records were tampered with.

**Visual:** Dark background. Headlines: "AI Agent Loses $2M in Unauthorized Trade" / "No Audit Trail for Agent Decisions"

---

### Scene 2: The Solution (0:10-0:20)

**Display text:** AgentLedger — If an agent gets paid, it leaves a receipt.

**Phonetic voiceover:** Agent Ledger. If an agent gets paid, it leaves a receipt. Every agent decision gets a tamper-proof hash on Casper. A flight recorder for the agent economy.

**Visual:** AgentLedger dashboard loads. Clean teal interface showing decision receipts.

---

### Scene 3: Live Demo — Treasury Agent Approves Payment (0:20-0:40)

**Display text:** A treasury agent approves a vendor payment. The decision is recorded on-chain.

**Phonetic voiceover:** Watch this treasury agent approve a vendor payment. It analyzes the invoice, checks the budget, and decides to approve. Before the payment executes, the agent calls record decision. The input hash, output hash, and job reference are recorded on Casper testnet. One transaction. One immutable receipt.

**Visual:**
1. RecordDemo page: agent_id = "treasury-agent-01", action_class = "vendor_payment_approval"
2. Input data: invoice details, budget check
3. Output data: approval decision, payment amount
4. Click "Attest Decision"
5. Loading spinner: "Submitting to Casper..."
6. Receipt appears: decision ID, hashes, deploy hash, explorer link

---

### Scene 4: Live Demo — Tamper Detection (0:40-0:55) — KILLER MOMENT

**Display text:** What if someone changes the decision after the fact?

**Phonetic voiceover:** But here is the critical question. What if someone changes the decision after the fact? Watch. We take the original approval and change the amount from ten thousand to fifty thousand. Now we verify. The hash does not match the on-chain attestation. Tamper detected. The ledger never lies.

**Visual:**
1. Verify page: paste original decision text
2. Hash matches on-chain record: green checkmark, "VERIFIED"
3. Edit the amount from 10000 to 50000
4. Click verify again
5. Hash mismatch: red X, "TAMPERED — This result does not match the on-chain attestation"
6. Side-by-side: original hash vs tampered hash

---

### Scene 5: Impact + Close (0:55-1:10)

**Display text:** Verifiable receipts for the agent economy. Built on Casper.

**Phonetic voiceover:** Agent Ledger turns every agent decision into a verifiable receipt. Casper's immutable ledger becomes the trust layer for autonomous A-I. Any agent. Any job. Every receipt on-chain.

**Visual:** Stats: decisions recorded, agents registered. GitHub link. Casper testnet explorer. AgentLedger logo.

---

## Key Moments
1. **Receipt creation** — agent attests decision, hash appears on Casper
2. **Tamper detection** — edit text, hash breaks, verification fails (THE demo moment)
3. **Explorer proof** — real Casper testnet transaction visible
4. **Job reference** — receipt links to paid work via job_payment_ref_hash

## Demo Steps Summary
- Step 1: Problem (0:00-0:10)
- Step 2: Solution (0:10-0:20)
- Step 3: Treasury agent records decision on-chain (0:20-0:40)
- Step 4: Tamper detection — edit text, verify fails (0:40-0:55) — KILLER MOMENT
- Step 5: Impact + Close (0:55-1:10)
