# Verify Receipt #119 — Independent Casper Testnet Verification

AgentLedger's core claim: an AI agent's decision was recorded on Casper testnet and can be
independently re-verified by anyone — without trusting AgentLedger's frontend, backend, or any
third party. This document lets you verify the demo's hero receipt (#119) yourself.

## The receipt
| Field | Value |
|---|---|
| Decision (receipt) | #119 |
| Transaction hash | `c737ef8d221a58214cfc27e3ae7c9424df61e68ef1013419c49c31ed09846682` |
| Block height | 8299405 |
| Contract package | `f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb` |
| Entry point | `record_decision` |
| Network | Casper testnet (`casper-test`) |
| Agent | `treasury-agent-01` |
| Action class | `vendor_payment_approval` |
| Input hash | `d37fd3b41d5b9b723996ee573859976544cecb178a30bd3f373ee91fddb2c27e` |
| Output hash | `2463ba13e7fa248a64ecec5abb95a07a0fc1c32b3b7a8668a0a0295bd208c784` |
| Job / payment ref hash | `x402-job-0x8a1b2c3d` |

## Three ways to verify (pick any)

### 1. One command (Node 18+, no dependencies)
    node verify_receipt_119.js
Queries the Casper testnet RPC (`info_get_transaction`) directly and confirms the transaction is
on-chain, executed successfully, called `record_decision` on the expected contract, and that the
on-chain named arguments match the receipt fields above. Exit 0 = verified.

### 2. Block explorer (no tools)
Open: https://testnet.cspr.live/transaction/c737ef8d221a58214cfc27e3ae7c9424df61e68ef1013419c49c31ed09846682
Confirm the transaction succeeded, called `record_decision`, and carries the input/output/job-ref
hashes above as session arguments.

### 3. In the live demo
Open `/receipt/119` and expand "Raw Casper Proof Data." The page performs the same RPC verification
client-side and shows "Verified from Casper RPC — data matches on-chain hashes exactly."

### casper-client (if installed)
    casper-client get-transaction c737ef8d221a58214cfc27e3ae7c9424df61e68ef1013419c49c31ed09846682 \
      --node-address https://node.testnet.casper.network

## Why this matters
The hashes are computed from the agent's exact input and output. If anyone later claims the agent
decided something different (a different amount or vendor), the recomputed hash won't match the
on-chain record — the tamper demo shows exactly this failure. That is the attestation guarantee: a
concrete, immutable, independently-verifiable record of what the agent decided.
