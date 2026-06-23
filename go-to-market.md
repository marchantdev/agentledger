# Go-to-Market — AgentLedger

**Date:** 2026-06-22

---

## Target User

**Primary:** DevOps/Platform engineers at companies deploying autonomous AI agents for financial operations (trading firms, fintech, asset managers). They need audit trails for compliance and dispute resolution.

**Secondary:** AI agent framework developers (LangChain, CrewAI, AutoGen ecosystem) who want to add verifiable decision logging to their frameworks.

**Persona:** "Alex, Senior Platform Engineer at a $50M AUM crypto fund. Manages 12 autonomous trading agents. Last month, one agent made a disputed trade. Alex spent 3 days reconstructing what happened from centralized logs. Needs tamper-proof audit trails."

## Distribution Channel

### Week 1 Actions (post-hackathon)
1. **Casper ecosystem channels:** Post in Casper Discord, tag @CasperLabs on X with demo video
2. **AI agent communities:** Post in LangChain Discord (#show-and-tell), CrewAI Discord, r/autonomous_ai
3. **Dev.to article:** "Building a Flight Recorder for AI Agents on Casper" — technical walkthrough with code
4. **GitHub README:** Clear "Quick Integration" section with 5-line example (already exists)

### Month 1 Actions
1. **npm package:** Publish `@agentledger/sdk` — one-line integration for any Node.js agent
2. **LangChain integration:** Build a LangChain callback handler that auto-attests decisions
3. **Hacker News:** "Show HN: On-chain audit trails for autonomous AI agents"
4. **Direct outreach:** 10 DMs to AI agent companies on X who've publicly discussed compliance

### Growth Flywheel
Agent developer integrates SDK → agent decisions appear on-chain → receipt pages are shareable → other developers see receipts → integrate SDK → more attestations → network effect on trust data.

## Pricing (Post-Hackathon)
- **Free tier:** 100 attestations/month on testnet
- **Pro:** $0.001/attestation on mainnet via x402 (gas + margin)
- **Enterprise:** Custom contract deployment + SLA + compliance reporting

## Competitive Moat
1. **First mover:** No other on-chain agent attestation system exists on any chain
2. **Data network effect:** More attestations = more trust signal = more integrations
3. **Casper lock-in:** Finality guarantees + institutional positioning = switching cost for enterprises
4. **Open source:** MIT license lowers adoption friction; enterprise support generates revenue

## Success Metrics (30 days post-launch)
- 5 external agents integrated via SDK
- 1,000 attestations on testnet
- 1 enterprise inquiry
- Dev.to article > 500 views
