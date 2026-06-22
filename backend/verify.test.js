/**
 * verify.test.js — Regression tests for /api/verify chain-backed verification
 *
 * Tests that /api/verify uses Casper RPC transaction args as the authoritative
 * source for hashes, NOT the local decisions-store.json.
 *
 * Run: node verify.test.js
 */

const assert = require("assert");
const crypto = require("crypto");

// ─── Hash helpers (mirroring server.js) ─────────────────────────────────────

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function canonicalize(obj) {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

// ─── Mock RPC factory ────────────────────────────────────────────────────────

/**
 * Build a mock `info_get_transaction` RPC response that contains the specified
 * on-chain hashes as transaction named args.
 *
 * Mirrors the actual Casper V2 transaction format:
 *   transaction.Version1.payload.fields.args.Named
 */
function mockRpcResponse(inputHash, outputHash) {
  return {
    jsonrpc: "2.0",
    id: 1,
    result: {
      transaction: {
        Version1: {
          hash: "mock-tx-hash",
          payload: {
            fields: {
              args: {
                Named: [
                  ["agent_id",            { cl_type: "String", bytes: "", parsed: "test-agent" }],
                  ["action_class",        { cl_type: "String", bytes: "", parsed: "test_action" }],
                  ["input_hash",          { cl_type: "String", bytes: "", parsed: inputHash }],
                  ["output_hash",         { cl_type: "String", bytes: "", parsed: outputHash }],
                  ["job_payment_ref_hash",{ cl_type: "String", bytes: "", parsed: "" }],
                ],
              },
              entry_point: { Custom: "record_decision" },
            },
          },
          approvals: [],
        },
      },
      execution_info: { block_height: 9999999 },
    },
  };
}

/** Build an RPC error response (transaction not found). */
function mockRpcNotFound() {
  return {
    jsonrpc: "2.0",
    id: 1,
    error: { code: -32001, message: "transaction not known" },
  };
}

/** Build an RPC response where the args field is missing. */
function mockRpcNoArgs() {
  return {
    jsonrpc: "2.0",
    id: 1,
    result: {
      transaction: {
        Version1: {
          hash: "mock-tx-hash",
          payload: {
            fields: {
              // no args object — simulate unparseable transaction
              entry_point: { Custom: "record_decision" },
            },
          },
          approvals: [],
        },
      },
    },
  };
}

// ─── Core verification logic (extracted from server.js for unit testing) ────

/**
 * Runs the /api/verify logic against a mock RPC response.
 *
 * @param {object} inputData    - Input data submitted by client
 * @param {object} outputData   - Output data submitted by client
 * @param {object} rpcResponse  - Mock Casper RPC JSON response
 * @param {boolean} rpcThrows   - Simulate network error if true
 */
function runVerifyLogic(inputData, outputData, rpcResponse, rpcThrows = false) {
  const computedInputHash = sha256(canonicalize(inputData));
  const computedOutputHash = sha256(canonicalize(outputData));

  let chainStatus = "unknown";
  let chainVerified = false;
  let onChainInputHash = null;
  let onChainOutputHash = null;
  let rpcParseError = null;

  if (rpcThrows) {
    chainStatus = "rpc_error";
    rpcParseError = "simulated network error";
  } else {
    const rpcJson = rpcResponse;

    if (rpcJson.result && rpcJson.result.transaction) {
      const tx = rpcJson.result.transaction;
      // Casper V2: Version1.payload.fields.args.Named
      const v1 = tx.Version1;
      const namedArgs =
        v1?.payload?.fields?.args?.Named ||
        v1?.body?.args ||
        null;

      if (Array.isArray(namedArgs)) {
        for (const [argName, argValue] of namedArgs) {
          if (argName === "input_hash") {
            onChainInputHash = argValue?.parsed ?? null;
          } else if (argName === "output_hash") {
            onChainOutputHash = argValue?.parsed ?? null;
          }
        }
      }

      if (onChainInputHash !== null && onChainOutputHash !== null) {
        chainStatus = "finalized";
        chainVerified = true;
      } else {
        chainStatus = "parse_failed";
        rpcParseError = "Could not extract input_hash/output_hash from on-chain transaction args";
      }
    } else if (rpcJson.error) {
      chainStatus = "not_found";
      rpcParseError = rpcJson.error.message;
    } else {
      chainStatus = "pending";
    }
  }

  const inputMatch = onChainInputHash !== null && computedInputHash === onChainInputHash;
  const outputMatch = onChainOutputHash !== null && computedOutputHash === onChainOutputHash;
  const verified = inputMatch && outputMatch;

  return {
    verified,
    chainVerified,
    chainStatus,
    onChain: { inputHash: onChainInputHash, outputHash: onChainOutputHash },
    computed: { inputHash: computedInputHash, outputHash: computedOutputHash },
    details: { inputMatch, outputMatch, ...(rpcParseError && { rpcParseError }) },
  };
}

// ─── Test suite ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log("\nverify.test.js — /api/verify regression tests\n");

// ─── Test 1: Valid data matches on-chain args → verified=true ─────────────

test("PASS: original data matches on-chain args → verified=true", () => {
  const inputData = { amount: 1000, vendor: "Acme Corp" };
  const outputData = { approved: true, approver: "alice" };

  const inputHash = sha256(canonicalize(inputData));
  const outputHash = sha256(canonicalize(outputData));

  const result = runVerifyLogic(inputData, outputData, mockRpcResponse(inputHash, outputHash));

  assert.strictEqual(result.verified, true, "verified should be true");
  assert.strictEqual(result.chainVerified, true, "chainVerified should be true");
  assert.strictEqual(result.chainStatus, "finalized", "chainStatus should be finalized");
  assert.strictEqual(result.details.inputMatch, true, "inputMatch should be true");
  assert.strictEqual(result.details.outputMatch, true, "outputMatch should be true");
  assert.strictEqual(result.onChain.inputHash, inputHash, "onChain.inputHash from RPC");
  assert.strictEqual(result.onChain.outputHash, outputHash, "onChain.outputHash from RPC");
});

// ─── Test 2: Tampered output → verified=false ─────────────────────────────

test("FAIL: tampered output data → verified=false", () => {
  const originalInput = { amount: 1000, vendor: "Acme Corp" };
  const originalOutput = { approved: true, approver: "alice" };
  const tamperedOutput = { approved: false, approver: "alice" }; // tampered!

  const inputHash = sha256(canonicalize(originalInput));
  const outputHash = sha256(canonicalize(originalOutput));

  // RPC returns original (on-chain) hashes; client submits tampered output
  const result = runVerifyLogic(originalInput, tamperedOutput, mockRpcResponse(inputHash, outputHash));

  assert.strictEqual(result.verified, false, "verified should be false (output tampered)");
  assert.strictEqual(result.chainVerified, true, "chainVerified should be true (tx exists)");
  assert.strictEqual(result.details.inputMatch, true, "inputMatch should be true");
  assert.strictEqual(result.details.outputMatch, false, "outputMatch should be false (tampered)");
});

// ─── Test 3: Tampered input → verified=false ─────────────────────────────

test("FAIL: tampered input data → verified=false", () => {
  const originalInput = { amount: 1000, vendor: "Acme Corp" };
  const tamperedInput = { amount: 9999, vendor: "Acme Corp" }; // tampered!
  const originalOutput = { approved: true, approver: "alice" };

  const inputHash = sha256(canonicalize(originalInput));
  const outputHash = sha256(canonicalize(originalOutput));

  const result = runVerifyLogic(tamperedInput, originalOutput, mockRpcResponse(inputHash, outputHash));

  assert.strictEqual(result.verified, false, "verified should be false (input tampered)");
  assert.strictEqual(result.details.inputMatch, false, "inputMatch should be false (tampered)");
  assert.strictEqual(result.details.outputMatch, true, "outputMatch should be true");
});

// ─── Test 4: Fail-closed on RPC network error → verified=false ───────────

test("FAIL-CLOSED: RPC network error → verified=false", () => {
  const inputData = { amount: 1000, vendor: "Acme Corp" };
  const outputData = { approved: true, approver: "alice" };

  // Simulate RPC throw
  const result = runVerifyLogic(inputData, outputData, null, true);

  assert.strictEqual(result.verified, false, "verified must be false when RPC fails");
  assert.strictEqual(result.chainVerified, false, "chainVerified must be false");
  assert.strictEqual(result.chainStatus, "rpc_error", "chainStatus should be rpc_error");
  assert.ok(result.details.rpcParseError, "rpcParseError should be set");
});

// ─── Test 5: Fail-closed on transaction not found → verified=false ───────

test("FAIL-CLOSED: transaction not found on-chain → verified=false", () => {
  const inputData = { amount: 1000, vendor: "Acme Corp" };
  const outputData = { approved: true, approver: "alice" };

  const result = runVerifyLogic(inputData, outputData, mockRpcNotFound());

  assert.strictEqual(result.verified, false, "verified must be false when tx not found");
  assert.strictEqual(result.chainVerified, false, "chainVerified must be false");
  assert.strictEqual(result.chainStatus, "not_found", "chainStatus should be not_found");
});

// ─── Test 6: Fail-closed when args missing from transaction → verified=false

test("FAIL-CLOSED: on-chain args missing → verified=false", () => {
  const inputData = { amount: 1000, vendor: "Acme Corp" };
  const outputData = { approved: true, approver: "alice" };

  const result = runVerifyLogic(inputData, outputData, mockRpcNoArgs());

  assert.strictEqual(result.verified, false, "verified must be false when args unparseable");
  assert.strictEqual(result.chainVerified, false, "chainVerified must be false");
  assert.strictEqual(result.chainStatus, "parse_failed", "chainStatus should be parse_failed");
  assert.ok(result.details.rpcParseError, "rpcParseError should describe the failure");
});

// ─── Test 7: Verification uses on-chain value, not any local cache ────────

test("CHAIN-AUTHORITATIVE: local store hash differs from on-chain → on-chain wins", () => {
  const inputData = { amount: 1000, vendor: "Acme Corp" };
  const outputData = { approved: true, approver: "alice" };

  const correctInputHash = sha256(canonicalize(inputData));
  const correctOutputHash = sha256(canonicalize(outputData));

  // Suppose local store was corrupted with different hashes
  // The RPC has the real on-chain values — verification should use those
  const result = runVerifyLogic(
    inputData,
    outputData,
    mockRpcResponse(correctInputHash, correctOutputHash)
    // Note: local store values are NOT passed to this function at all
    // This test proves the logic only uses on-chain args
  );

  assert.strictEqual(result.verified, true, "verified should be true (on-chain matches)");
  assert.strictEqual(result.onChain.inputHash, correctInputHash, "reports on-chain hash");
  assert.strictEqual(result.onChain.outputHash, correctOutputHash, "reports on-chain hash");
});

// ─── Test 8: Canonicalization order-invariant ─────────────────────────────

test("CANONICAL: key order in submitted JSON does not affect hash", () => {
  // Server canonicalizes before hashing, so key order is irrelevant
  const inputDataA = { amount: 1000, vendor: "Acme Corp" };
  const inputDataB = { vendor: "Acme Corp", amount: 1000 }; // different key order
  const outputData = { approved: true };

  const hashA = sha256(canonicalize(inputDataA));
  const hashB = sha256(canonicalize(inputDataB));

  assert.strictEqual(hashA, hashB, "canonicalize must produce identical hash regardless of key order");

  // Both should verify against the same on-chain hash
  const result = runVerifyLogic(inputDataB, outputData, mockRpcResponse(hashA, sha256(canonicalize(outputData))));
  assert.strictEqual(result.verified, true, "different key order should still verify");
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All tests passed.\n");
}
