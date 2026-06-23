/**
 * record-injection.test.js — Security regression tests for /api/workbench/record
 *
 * After removing /api/record (user-controlled input), these tests verify:
 * 1. Only valid fixed scenarios (vendor_payment, defi_swap, risk_alert) are accepted
 * 2. Invalid/injection scenarios get 400
 * 3. No user-controlled strings reach casper-client
 * 4. Auth is required (requireSecret)
 * 5. Preset data is used exactly — no user payload passes through
 *
 * Run: NODE_ENV=test TEST_MODE=1 BACKEND_SECRET=test-secret-12345 node record-injection.test.js
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
const SECRET = process.env.BACKEND_SECRET || "test-secret-12345";

function postJSON(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `${BASE}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...headers,
        },
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

// ─── Injection payloads (as scenario names) ─────────────────────────────────

const INJECTION_SCENARIOS = [
  { label: "shell command substitution", value: "$(whoami)" },
  { label: "backtick injection", value: "`id`" },
  { label: "semicolon chaining", value: "legit; rm -rf /" },
  { label: "pipe injection", value: "legit | cat /etc/passwd" },
  { label: "newline injection", value: "legit\nid" },
  { label: "null byte", value: "legit\x00id" },
  { label: "path traversal", value: "../../../etc/passwd" },
  { label: "prototype pollution", value: "__proto__" },
  { label: "constructor pollution", value: "constructor" },
];

// ─── Boot a test-only server instance ───────────────────────────────────────

const child_process = require("child_process");
const originalExecFileSync = child_process.execFileSync;
let execFileCalls = [];

function startTestServer() {
  return new Promise((resolve) => {
    process.env.TEST_MODE = "1";
    process.env.NODE_ENV = "test";

    child_process.execFileSync = function (cmd, args, opts) {
      execFileCalls.push({ cmd, args: [...args] });
      return Buffer.from(JSON.stringify({
        result: {
          transaction_hash: { Version1: "test-tx-" + crypto.randomBytes(8).toString("hex") },
        },
      }));
    };

    process.env.PORT = PORT;
    const serverPath = require.resolve("./server.js");
    delete require.cache[serverPath];

    const origLog = console.log;
    console.log = () => {};
    require("./server.js");
    setTimeout(() => {
      console.log = origLog;
      resolve();
    }, 500);
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function run() {
  console.log("\nrecord-injection.test.js — /api/workbench/record security regression tests\n");

  const baseline = await getJSON("/api/stats");
  const baselineCount = baseline.body.totalDecisions;

  // ─── 1. Auth required: no secret → 401 ────────────────────────────────
  await test("AUTH: request without secret gets 401", async () => {
    const res = await postJSON("/api/workbench/record", { scenario: "vendor_payment" });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // ─── 2. Auth required: wrong secret → 401 ─────────────────────────────
  await test("AUTH: request with wrong secret gets 401", async () => {
    const res = await postJSON("/api/workbench/record", { scenario: "vendor_payment" }, {
      "X-Backend-Secret": "wrong-secret",
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // ─── 3. Injection scenarios → 400 ─────────────────────────────────────
  for (const { label, value } of INJECTION_SCENARIOS) {
    const callsBefore = execFileCalls.length;
    await test(`REJECT scenario injection: ${label}`, async () => {
      const res = await postJSON("/api/workbench/record", { scenario: value }, {
        "X-Backend-Secret": SECRET,
      });
      assert.strictEqual(res.status, 400, `Expected 400 for injection scenario, got ${res.status}`);
      assert.strictEqual(execFileCalls.length, callsBefore,
        "execFileSync must NOT be called for invalid scenario");
    });
  }

  // ─── 4. Valid scenarios succeed ────────────────────────────────────────
  const validScenarios = ["vendor_payment", "defi_swap", "risk_alert"];
  for (const scenario of validScenarios) {
    await test(`ACCEPT valid scenario: ${scenario}`, async () => {
      const res = await postJSON("/api/workbench/record", { scenario }, {
        "X-Backend-Secret": SECRET,
      });
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      assert.ok(res.body.success, "Response should have success=true");
      assert.ok(res.body.txHash, "Response should have txHash");
      // V1 fix: response must include the full decision record so the frontend
      // can display the fresh receipt without a second round-trip against static /decisions.json
      assert.ok(res.body.decision, "Response should include full decision object");
      assert.strictEqual(res.body.decision.decisionId, res.body.decisionId, "decision.decisionId must match top-level decisionId");
      assert.ok(res.body.decision.txHash, "decision.txHash must be present");
      assert.strictEqual(res.body.decision.txHash, res.body.txHash, "decision.txHash must match top-level txHash");
    });
  }

  // ─── 5. Preset data used — no user strings in casper-client args ──────
  await test("PRESET-ONLY: casper-client args contain only preset agentId, not user input", async () => {
    // Filter to only put-transaction calls (exclude account-address balance checks)
    const txCalls = execFileCalls.filter(c => c.args[0] === "put-transaction");
    // Should have exactly 3 from the valid scenario tests above
    assert.ok(txCalls.length >= 3, `Expected at least 3 put-transaction calls, got ${txCalls.length}`);
    const last3 = txCalls.slice(-3);
    const expectedAgents = ["treasury-agent-01", "trading-agent-alpha", "risk-monitor-eu"];
    for (let i = 0; i < 3; i++) {
      const agentArg = last3[i].args.find(a => a.startsWith("agent_id:string="));
      assert.ok(agentArg, "Should have agent_id session-arg");
      assert.strictEqual(agentArg, `agent_id:string='${expectedAgents[i]}'`,
        `Expected preset agent ${expectedAgents[i]}, got: ${agentArg}`);
    }
  });

  // ─── 6. /api/record endpoint removed ───────────────────────────────────
  await test("REMOVED: /api/record returns 404", async () => {
    const res = await postJSON("/api/record", {
      agentId: "test-agent",
      actionClass: "test_action",
      inputData: { x: 1 },
      outputData: { y: 2 },
    }, { "X-Backend-Secret": SECRET });
    assert.strictEqual(res.status, 404, `Expected 404 for removed endpoint, got ${res.status}`);
  });

  // ─── 7. Missing scenario → 400 ────────────────────────────────────────
  await test("REJECT missing scenario field", async () => {
    const res = await postJSON("/api/workbench/record", {}, {
      "X-Backend-Secret": SECRET,
    });
    assert.strictEqual(res.status, 400, `Expected 400 for missing scenario, got ${res.status}`);
  });

  // ─── 8. Extra fields ignored — only scenario used ──────────────────────
  await test("IGNORE extra fields: only scenario matters", async () => {
    const callsBefore = execFileCalls.length;
    const res = await postJSON("/api/workbench/record", {
      scenario: "vendor_payment",
      agentId: "evil-agent",
      inputData: { amount: 999999 },
      outputData: { decision: "STEAL" },
    }, { "X-Backend-Secret": SECRET });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    // Verify preset agent was used, not the injected one
    const lastCall = execFileCalls[execFileCalls.length - 1];
    const agentArg = lastCall.args.find(a => a.startsWith("agent_id:string="));
    assert.strictEqual(agentArg, "agent_id:string='treasury-agent-01'",
      "Must use preset agentId, not user-supplied 'evil-agent'");
  });

  // ─── 9. No spurious decisions from injection attempts ──────────────────
  await test("SIDE-EFFECTS: only valid scenarios created decisions", async () => {
    const after = await getJSON("/api/stats");
    // 3 valid scenario tests + 1 extra-fields test = 4 new decisions
    const expected = baselineCount + 4;
    assert.strictEqual(after.body.totalDecisions, expected,
      `Expected ${expected} decisions (baseline ${baselineCount} + 4), got ${after.body.totalDecisions}`);
  });

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
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
