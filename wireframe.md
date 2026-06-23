# AgentLedger Wireframe

## Page 1: Landing (/)

```
+--------------------------------------------------+
|  [AgentLedger Logo]              [Connect Wallet] |
+--------------------------------------------------+
|  HERO: A flight recorder for AI agents             |
|  Subtext: Every decision. On-chain. Verifiable.    |
|  [View Agent Decisions]  [Learn More]              |
+--------------------------------------------------+
|  HOW IT WORKS                                      |
|  1. Agent decides  2. Hash recorded  3. Verified   |
+--------------------------------------------------+
|  PROOF SECTION                                     |
|  Contract addr   Testnet link   Stats              |
+--------------------------------------------------+
```

## Page 2: Dashboard (/dashboard)

```
+--------------------------------------------------+
|  [Logo]  Dashboard  Docs          [Wallet: 0x..]  |
+--------------------------------------------------+
|  Agent: trading-bot-001                            |
|  Total decisions: 47  Last: 2 min ago              |
+--------------------------------------------------+
|  DECISION TIMELINE                                 |
|  | Time  | Type   | Action    | Explorer Link    | |
|  | 12:05 | TRADE  | Buy CSPR  | [Link]           | |
|  | 12:03 | QUERY  | Price chk | [Link]           | |
+--------------------------------------------------+
|  DECISION DETAIL (expanded)                        |
|  Input hash: 0xabc...                              |
|  Output hash: 0xdef...                             |
|  Tx: [View on Casper Explorer]                     |
+--------------------------------------------------+
```

## Page 3: Record (/record)

```
+--------------------------------------------------+
|  [Logo]  Dashboard  Record  Docs  [Wallet]        |
+--------------------------------------------------+
|  RECORD NEW DECISION                               |
|  Agent ID: [text field]                            |
|  Action:   [TRADE / QUERY / TRANSFER]              |
|  Input:    [text area]                             |
|  Output:   [text area]                             |
|  Hashes auto-computed below                        |
|  [Record Decision on Casper]                       |
|  Cost: ~0.001 CSPR via x402                        |
+--------------------------------------------------+
```

## Navigation
- Logo leads to Landing
- Dashboard leads to /dashboard
- Record leads to /record
- Wallet button uses CSPR.click

## CTA Hierarchy
1. Primary: Record Decision on Casper (action)
2. Secondary: View Agent Decisions (discovery)
3. Tertiary: Explorer links (verification)
