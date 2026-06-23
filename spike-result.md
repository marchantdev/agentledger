# Spike Result: Odra Contract Compilation + Testnet Deploy

## Component
Odra smart contract (Rust) for decision hash registry.

## Why Risky
Rust + Odra framework is new. Casper testnet deploy untested. All features depend on this.

## Status: COMPLETE

## Works?
YES. Full M1 vertical slice verified:

1. **Contract compiled** — 2/2 tests pass (`cargo test` in Odra framework)
2. **WASM built** — 184KB optimized (`DecisionRegistry_opt.wasm`)
3. **Deployed to Casper testnet** — Contract package hash: `hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb`
4. **record_decision called successfully** — TX hash: `2ab7b9c8400274066754386ca999ae6344a85d0c33ff6ec433fa5991eeb9e536`
   - Block height: 8233736
   - error_message: null (SUCCESS)
   - Gas consumed: 715,261,251 motes (~0.715 CSPR)
   - Args: agent_id=treasury-agent-01, action_class=vendor_payment_approval, input/output hashes, job_payment_ref=x402-job-0x7f3a2b1c
5. **Entry points verified**: record_decision, get_decision, get_total_decisions, get_agent_decision_count, init

## Key Technical Findings
- Casper 2.0 requires `put-transaction package` (not `put-deploy`) for calling deployed contracts
- Node endpoint: `https://node.testnet.casper.network/rpc` (HTTPS port 443, NOT port 7777)
- Explorer: `https://testnet.cspr.live/transaction/{hash}`
- Account key: 016e802ff29d677cf426fbb1ad98b26ac35fa659d8afd8d690ea62ac433a3ceb96
- Remaining balance: ~9.78 CSPR

## Confidence to Continue
HIGH. Odra compiles, deploys, and executes on Casper testnet. No pivoting needed.
