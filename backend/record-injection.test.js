/**
 * record-injection.test.js — Regression tests for /api/record injection protection
 *
 * Verifies that:
 * 1. Injection payloads in agentId/actionClass/jobPaymentRefHash get 400
 * 2. No side-effect (no shell execution, no new decisions created)
 * 3. The arg-quoting fix stores clean (unquoted) values
 *
 * Run: node record-injection.test.js
 */

const assert = require("assert");
const http = require("http");
const crypto = require("crypto");

// ─── Test framework ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  return fn().then(() => {
    console.log(`  ✓ ${name}`);
    passed++;
  }).catch((err) => {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  });
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

const PORT = process.env.TEST_PORT || 3099;
const BASE = `http://127.0.0.1:${PORT}`;

function postJSON(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BASE}${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(chunks) });
          } catch {
            resolve({ status: res.statusCode, body: chunks });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let chunks = "";
      res.on("data", (c) => (chunks += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, body: chunks });
        }
      });
    }).on("error", reject);
  });
}

// ─── Injection payloads ─────────────────────────────────────────────────────

const INJECTION_PAYLOADS = [
  { label: "shell command substitution", value: "$(whoami)" },
  { label: "backtick injection", value: "`id`" },
  { label: "semicolon chaining", value: "legit; rm -rf /" },
  { label: "pipe injection", value: "legit | cat /etc/passwd" },
  { label: "newline injection", value: "legit\nid" },
  { label: "single-quote escape", value: "legit'; id; echo '" },
  { label: "double-quote escape", value: 'legit"; id; echo "' },
  { label: "ampersand background", value: "legit & id" },
  { label: "null byte", value: "legit\x00id" },
  { label: "curly brace expansion", value: "{cat,/etc/passwd}" },
];

// ─── Boot a test-only server instance ───────────────────────────────────────

// We dynamically load the Express app module to test it in isolation.
// To avoid actually calling casper-client, we monkey-patch execFileSync.
const Module = require("module");
const child_process = require("child_process");
const originalExecFileSync = child_process.execFileSync;
let execFileCalls = []; // records all calls for side-effect auditing

function startTestServer() {
  return new Promise((resolve) => {
    // Patch execFileSync to capture calls without running casper-client
    child_process.execFileSync = function (cmd, args, opts) {
      execFileCalls.push({ cmd, args: [...args] });
      // Return a fake successful Casper tx response
      return Buffer.from(JSON.stringify({
        result: {
          transaction_hash: { Version1: "test-tx-" + crypto.randomBytes(8).toString("hex") },
        },
      }));
    };

    // Set port and load server
    process.env.PORT = PORT;
    // Clear require cache so server.js loads fresh
    const serverPath = require.resolve("./server.js");
    delete require.cache[serverPath];

    // Suppress console.log from server startup
    const origLog = console.log;
    console.log = () => {};

    const app = require("./server.js");

    // Restore console.log after a tick (server logs on listen)
    setTimeout(() => {
      console.log = origLog;
      resolve();
    }, 500);
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function run() {
  console.log("\nrecord-injection.test.js — /api/record injection regression tests\n");

  // Get baseline decision count
  const baseline = await getJSON("/api/stats");
  const baselineCount = baseline.body.totalDecisions;

  // ─── Injection tests: each payload in agentId should yield 400 ────────
  for (const { label, value } of INJECTION_PAYLOADS) {
    const callsBefore = execFileCalls.length;

    await test(`REJECT agentId injection: ${label}`, async () => {
      const res = await postJSON("/api/record", {
        agentId: value,
        actionClass: "test_action",
        inputData: { x: 1 },
        outputData: { y: 2 },
      });
      assert.strictEqual(res.status, 400, `Expected 400 for injection payload, got ${res.status}`);
      assert.ok(res.body.error, "Response should contain error field");
      // Verify no shell call was made
      assert.strictEqual(
        execFileCalls.length,
        callsBefore,
        "execFileSync must NOT be called for rejected input"
      );
    });
  }

  // ─── Injection in actionClass ─────────────────────────────────────────
  await test("REJECT actionClass injection: shell command substitution", async () => {
    const callsBefore = execFileCalls.length;
    const res = await postJSON("/api/record", {
      agentId: "clean-agent",
      actionClass: "$(rm -rf /)",
      inputData: { x: 1 },
      outputData: { y: 2 },
    });
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
    assert.strictEqual(execFileCalls.length, callsBefore, "No shell call for bad actionClass");
  });

  // ─── Injection in jobPaymentRefHash ───────────────────────────────────
  await test("REJECT jobPaymentRefHash injection: pipe injection", async () => {
    const callsBefore = execFileCalls.length;
    const res = await postJSON("/api/record", {
      agentId: "clean-agent",
      actionClass: "payment_check",
      inputData: { x: 1 },
      outputData: { y: 2 },
      jobPaymentRefHash: "legit | cat /etc/passwd",
    });
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
    assert.strictEqual(execFileCalls.length, callsBefore, "No shell call for bad jobRef");
  });

  // ─── Verify no decisions were created by injection attempts ───────────
  await test("NO SIDE-EFFECT: injection attempts created zero new decisions", async () => {
    const after = await getJSON("/api/stats");
    assert.strictEqual(
      after.body.totalDecisions,
      baselineCount,
      `Expected ${baselineCount} decisions, got ${after.body.totalDecisions} — injection created a decision!`
    );
  });

  // ─── Clean input: valid record stores unquoted agentId ────────────────
  await test("CLEAN VALUE: valid record stores unquoted agentId in execFileSync args", async () => {
    const callsBefore = execFileCalls.length;
    const res = await postJSON("/api/record", {
      agentId: "my-agent-v2",
      actionClass: "vendor_payment",
      inputData: { amount: 100 },
      outputData: { approved: true },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.body.success, "Response should have success=true");

    // Check the execFileSync call args — agentId must NOT have quotes
    const lastCall = execFileCalls[execFileCalls.length - 1];
    assert.ok(lastCall, "execFileSync should have been called");

    const agentArg = lastCall.args.find((a) => a.startsWith("agent_id:string="));
    assert.ok(agentArg, "Should have agent_id session-arg");
    assert.strictEqual(
      agentArg,
      "agent_id:string=my-agent-v2",
      `agentId arg must be unquoted, got: ${agentArg}`
    );
    // Verify NO single quotes around the value
    assert.ok(
      !agentArg.includes("'"),
      `agentId arg must not contain literal quotes, got: ${agentArg}`
    );
  });

  // ─── Missing fields → 400 ────────────────────────────────────────────
  await test("REJECT missing required fields", async () => {
    const res = await postJSON("/api/record", {
      agentId: "test-agent",
      // missing actionClass, inputData, outputData
    });
    assert.strictEqual(res.status, 400, `Expected 400 for missing fields, got ${res.status}`);
  });

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  // Restore original execFileSync
  child_process.execFileSync = originalExecFileSync;

  if (failed > 0) {
    console.log("SOME TESTS FAILED.\n");
    process.exit(1);
  } else {
    console.log("All tests passed.\n");
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  await startTestServer();
  await run();
  process.exit(0);
})();
