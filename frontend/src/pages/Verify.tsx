import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Loader2,
  Hash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Zap,
  RotateCcw,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { DecisionRecord } from "../lib/types";
import type { VerifyResponse } from "../lib/api";

type DemoStep = "idle" | "verify_original" | "show_verified" | "tampering" | "verify_tampered" | "show_tampered" | "done";

const DEMO_STEP_LABELS: Record<DemoStep, string> = {
  idle: "",
  verify_original: "Step 1: Verifying original data against on-chain record...",
  show_verified: "Data matches on-chain hash. Now watch what happens when data is tampered.",
  tampering: "Step 2: Simulating tampering — changing the payment amount...",
  verify_tampered: "Step 2: Verifying tampered data against on-chain record...",
  show_tampered: "Tampering detected! The hash mismatch proves the data was modified.",
  done: "Demo complete. The on-chain hash is immutable — any change breaks the match.",
};

export default function Verify() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [selected, setSelected] = useState<DecisionRecord | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoStep, setDemoStep] = useState<DemoStep>("idle");
  const [demoRunning, setDemoRunning] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api
      .getDecisions()
      .then((res) => {
        setDecisions(res.decisions);
        if (res.decisions.length > 0) {
          selectDecision(res.decisions[0]);
        }
      })
      .catch(() => setError("Failed to load decisions from API"))
      .finally(() => setFetchLoading(false));
  }, []);

  const selectDecision = (d: DecisionRecord) => {
    setSelected(d);
    setInputText(JSON.stringify(d.inputData || {}, null, 2));
    setOutputText(JSON.stringify(d.outputData || {}, null, 2));
    setResult(null);
    setDropdownOpen(false);
  };

  const handleVerify = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const inputData = JSON.parse(inputText);
      const outputData = JSON.parse(outputText);
      const res = await api.verify(selected.decisionId, inputData, outputData);
      setResult(res);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON in input or output data");
      } else {
        setError(err.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  }, [selected, inputText, outputText]);

  const runGuidedDemo = useCallback(async () => {
    if (!selected || demoRunning) return;
    setDemoRunning(true);
    setError(null);

    // Reset to original data
    const originalInput = JSON.stringify(selected.inputData || {}, null, 2);
    const originalOutput = JSON.stringify(selected.outputData || {}, null, 2);
    setInputText(originalInput);
    setOutputText(originalOutput);
    setResult(null);

    // Step 1: Verify original — should pass
    setDemoStep("verify_original");
    await new Promise((r) => setTimeout(r, 800));
    setLoading(true);
    try {
      const inputData = JSON.parse(originalInput);
      const outputData = JSON.parse(originalOutput);
      const res1 = await api.verify(selected.decisionId, inputData, outputData);
      setResult(res1);
      setLoading(false);
      setDemoStep("show_verified");
    } catch {
      setLoading(false);
      setDemoRunning(false);
      setDemoStep("idle");
      setError("Demo failed — could not verify original data");
      return;
    }

    // Pause to let user see the VERIFIED result
    await new Promise((r) => setTimeout(r, 3000));

    // Step 2: Tamper with the data
    setDemoStep("tampering");
    setResult(null);
    await new Promise((r) => setTimeout(r, 600));

    // Modify the output — change amount or decision
    const tamperedOutput = { ...(selected.outputData || {}) };
    if ("payment_amount" in tamperedOutput) {
      tamperedOutput.payment_amount = (tamperedOutput.payment_amount as number) + 5000;
    } else if ("decision" in tamperedOutput) {
      tamperedOutput.decision = tamperedOutput.decision === "APPROVED" ? "REJECTED" : "APPROVED";
    } else {
      tamperedOutput._tampered = true;
    }
    const tamperedOutputText = JSON.stringify(tamperedOutput, null, 2);
    setOutputText(tamperedOutputText);

    // Scroll to the output textarea
    if (outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    await new Promise((r) => setTimeout(r, 1200));

    // Step 3: Verify tampered data — should fail
    setDemoStep("verify_tampered");
    setLoading(true);
    try {
      const inputData = JSON.parse(originalInput);
      const res2 = await api.verify(selected.decisionId, inputData, tamperedOutput);
      setResult(res2);
      setLoading(false);
      setDemoStep("show_tampered");
    } catch {
      setLoading(false);
      setDemoStep("idle");
      setDemoRunning(false);
      setError("Demo failed — could not verify tampered data");
      return;
    }

    await new Promise((r) => setTimeout(r, 2000));
    setDemoStep("done");
    setDemoRunning(false);
  }, [selected, demoRunning]);

  const resetDemo = () => {
    setDemoStep("idle");
    setDemoRunning(false);
    if (selected) {
      setInputText(JSON.stringify(selected.inputData || {}, null, 2));
      setOutputText(JSON.stringify(selected.outputData || {}, null, 2));
    }
    setResult(null);
    setError(null);
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: theme.colors.primary }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Verify Decision Integrity
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Prove that a recorded agent decision hasn't been tampered with.
          Edit the data below or run the guided demo.
        </p>
      </div>

      {/* Guided Demo Banner */}
      {selected && demoStep === "idle" && (
        <button
          onClick={runGuidedDemo}
          className={`w-full flex items-center gap-4 p-4 ${theme.ui.radius} border text-left transition-all hover:border-current`}
          style={{
            borderColor: theme.colors.primary + "40",
            backgroundColor: theme.colors.primary + "08",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.colors.primary + "20" }}
          >
            <Zap size={20} style={{ color: theme.colors.primary }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
              Try the Guided Demo
            </p>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>
              Watch tamper detection in action: verify original data, then see what happens when it's changed.
            </p>
          </div>
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: theme.colors.primary, color: "#000" }}
          >
            Run Demo
          </span>
        </button>
      )}

      {/* Demo progress indicator */}
      {demoStep !== "idle" && (
        <div
          className={`flex items-center gap-3 p-4 ${theme.ui.radius} border`}
          style={{
            borderColor: demoStep === "done"
              ? theme.colors.success + "40"
              : demoStep.includes("tamper")
                ? theme.colors.error + "40"
                : theme.colors.primary + "40",
            backgroundColor: demoStep === "done"
              ? theme.colors.success + "08"
              : demoStep.includes("tamper")
                ? theme.colors.error + "08"
                : theme.colors.primary + "08",
          }}
        >
          {demoRunning ? (
            <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: theme.colors.primary }} />
          ) : (
            <CheckCircle size={16} className="flex-shrink-0" style={{ color: theme.colors.success }} />
          )}
          <p className="text-sm flex-1" style={{ color: theme.colors.text }}>
            {DEMO_STEP_LABELS[demoStep]}
          </p>
          {!demoRunning && (
            <button
              onClick={resetDemo}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/10"
              style={{ color: theme.colors.textMuted }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      )}

      {/* Decision selector */}
      <div className="relative">
        <label
          className="text-xs uppercase tracking-wider mb-1.5 block"
          style={{ color: theme.colors.textMuted }}
        >
          Select Decision
        </label>
        <button
          onClick={() => !demoRunning && setDropdownOpen(!dropdownOpen)}
          disabled={demoRunning}
          className={`w-full flex items-center justify-between px-4 py-3 ${theme.ui.radius} border text-left transition-colors`}
          style={{
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            opacity: demoRunning ? 0.5 : 1,
          }}
        >
          {selected ? (
            <span className="font-mono text-sm">
              #{selected.decisionId} &mdash; {selected.agentId} /{" "}
              {selected.actionClass}
            </span>
          ) : (
            <span style={{ color: theme.colors.textMuted }}>
              Choose a decision...
            </span>
          )}
          <ChevronDown
            size={16}
            style={{ color: theme.colors.textMuted }}
            className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>
        {dropdownOpen && (
          <div
            className={`absolute z-20 mt-1 w-full ${theme.ui.radius} border shadow-lg max-h-60 overflow-auto`}
            style={{
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            {decisions.map((d) => (
              <button
                key={d.decisionId}
                onClick={() => selectDecision(d)}
                className="w-full text-left px-4 py-2.5 text-sm font-mono border-b last:border-b-0 transition-colors hover:bg-white/5"
                style={{
                  borderColor: theme.colors.border + "60",
                  color:
                    selected?.decisionId === d.decisionId
                      ? theme.colors.primary
                      : theme.colors.text,
                }}
              >
                #{d.decisionId} &mdash; {d.agentId} / {d.actionClass}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          {/* Decision metadata */}
          <div
            className={`card ${theme.ui.radius} flex flex-wrap gap-x-8 gap-y-2`}
          >
            <div>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: theme.colors.textMuted }}
              >
                Agent
              </span>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.text }}
              >
                {selected.agentId}
              </p>
            </div>
            <div>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: theme.colors.textMuted }}
              >
                Action
              </span>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.text }}
              >
                {selected.actionClass}
              </p>
            </div>
            <div>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: theme.colors.textMuted }}
              >
                Block
              </span>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.text }}
              >
                #{selected.blockHeight}
              </p>
            </div>
            <div>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: theme.colors.textMuted }}
              >
                Timestamp
              </span>
              <p
                className="text-sm font-mono"
                style={{ color: theme.colors.text }}
              >
                {new Date(selected.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="ml-auto flex items-end">
              <a
                href={`https://testnet.cspr.live/transaction/${selected.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: theme.colors.primary }}
              >
                <ExternalLink size={12} /> View on Explorer
              </a>
            </div>
          </div>

          {/* Editable data areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label
                className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2"
                style={{ color: theme.colors.textMuted }}
              >
                <Hash size={12} /> Input Data
                <span className="normal-case tracking-normal opacity-60">
                  (edit to test tamper detection)
                </span>
              </label>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setResult(null);
                }}
                rows={8}
                disabled={demoRunning}
                className={`w-full px-3 py-2 ${theme.ui.radius} border text-xs font-mono bg-transparent resize-none focus:outline-none focus:ring-1`}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  opacity: demoRunning ? 0.7 : 1,
                }}
                spellCheck={false}
              />
            </div>
            <div>
              <label
                className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2"
                style={{ color: theme.colors.textMuted }}
              >
                <Hash size={12} /> Output Data
                {demoStep === "tampering" || demoStep === "verify_tampered" || demoStep === "show_tampered" || demoStep === "done" ? (
                  <span className="normal-case tracking-normal text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.colors.error + "20", color: theme.colors.error }}>
                    modified
                  </span>
                ) : (
                  <span className="normal-case tracking-normal opacity-60">
                    (edit to test tamper detection)
                  </span>
                )}
              </label>
              <textarea
                ref={outputRef}
                value={outputText}
                onChange={(e) => {
                  setOutputText(e.target.value);
                  setResult(null);
                }}
                rows={8}
                disabled={demoRunning}
                className={`w-full px-3 py-2 ${theme.ui.radius} border text-xs font-mono bg-transparent resize-none focus:outline-none focus:ring-1 transition-colors`}
                style={{
                  borderColor: demoStep === "tampering" || demoStep === "verify_tampered" || demoStep === "show_tampered"
                    ? theme.colors.error + "60"
                    : theme.colors.border,
                  color: theme.colors.text,
                  opacity: demoRunning ? 0.7 : 1,
                }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || demoRunning}
            className="btn-primary flex items-center justify-center gap-2 w-full py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Verifying
                against on-chain record...
              </>
            ) : (
              <>
                <Shield size={18} /> Verify Against On-Chain Record
              </>
            )}
          </button>

          {error && (
            <div
              className={`flex items-center gap-3 p-4 ${theme.ui.radius}`}
              style={{ backgroundColor: theme.colors.error + "15" }}
            >
              <AlertTriangle size={20} style={{ color: theme.colors.error }} />
              <p className="text-sm" style={{ color: theme.colors.error }}>
                {error}
              </p>
            </div>
          )}

          {/* Verification result */}
          {result && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Verdict banner */}
              <div
                className={`flex items-center gap-4 p-5 ${theme.ui.radius}`}
                style={{
                  backgroundColor: result.verified
                    ? theme.colors.success + "10"
                    : theme.colors.error + "10",
                  borderLeft: `4px solid ${result.verified ? theme.colors.success : theme.colors.error}`,
                }}
              >
                {result.verified ? (
                  <ShieldCheck
                    size={36}
                    style={{ color: theme.colors.success }}
                  />
                ) : (
                  <ShieldX size={36} style={{ color: theme.colors.error }} />
                )}
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: result.verified
                        ? theme.colors.success
                        : theme.colors.error,
                      fontFamily: theme.fonts.headline,
                    }}
                  >
                    {result.verified
                      ? "VERIFIED"
                      : result.chainStatus === "rpc_error" || result.chainStatus === "parse_failed" || result.chainStatus === "not_found"
                        ? "UNVERIFIABLE"
                        : "TAMPERED"}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {result.verified
                      ? "Decision data matches the on-chain record exactly."
                      : result.chainStatus === "rpc_error" || result.chainStatus === "parse_failed"
                        ? "Could not verify — chain RPC unavailable. The decision record is unchanged."
                        : result.chainStatus === "not_found"
                          ? "Could not verify — transaction not found on Casper Testnet."
                          : "Decision data does not match the on-chain attestation. The data has been modified."}
                  </p>
                </div>
              </div>

              {/* Hash comparison table */}
              <div className={`card ${theme.ui.radius}`}>
                <h3
                  className="font-semibold mb-4 flex items-center gap-2"
                  style={{ color: theme.colors.text }}
                >
                  <Hash size={16} style={{ color: theme.colors.accent }} />
                  Hash Comparison
                </h3>
                <div className="space-y-3">
                  <HashRow
                    label="Input Hash"
                    onChain={result.onChain.inputHash ?? "—"}
                    computed={result.computed.inputHash}
                    match={result.details.inputMatch}
                  />
                  <HashRow
                    label="Output Hash"
                    onChain={result.onChain.outputHash ?? "—"}
                    computed={result.computed.outputHash}
                    match={result.details.outputMatch}
                  />
                </div>
              </div>

              {/* On-chain proof */}
              <div className={`card ${theme.ui.radius}`}>
                <h3
                  className="font-semibold mb-3 flex items-center gap-2"
                  style={{ color: theme.colors.text }}
                >
                  <Shield size={16} style={{ color: theme.colors.accent }} />
                  On-Chain Proof
                </h3>
                {/* Chain RPC verification badge */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm"
                  style={{
                    backgroundColor: result.chainVerified
                      ? theme.colors.success + "12"
                      : result.chainStatus === "rpc_error" || result.chainStatus === "parse_failed"
                        ? theme.colors.warning + "12"
                        : theme.colors.error + "12",
                  }}
                >
                  {result.chainVerified ? (
                    <CheckCircle size={16} style={{ color: theme.colors.success }} />
                  ) : (
                    <XCircle size={16} style={{ color: result.chainStatus === "rpc_error" || result.chainStatus === "parse_failed" ? theme.colors.warning : theme.colors.error }} />
                  )}
                  <span style={{ color: result.chainVerified ? theme.colors.success : result.chainStatus === "rpc_error" || result.chainStatus === "parse_failed" ? theme.colors.warning : theme.colors.error }}>
                    {result.chainVerified
                      ? "Transaction args verified on Casper Testnet"
                      : result.chainStatus === "not_found"
                        ? "Transaction not found on chain"
                        : result.chainStatus === "rpc_error"
                          ? "Chain RPC temporarily unavailable — try again"
                          : result.chainStatus === "parse_failed"
                            ? "Could not parse transaction args from chain"
                            : "Chain status: " + result.chainStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Transaction
                    </span>
                    <p
                      className="font-mono text-xs truncate"
                      style={{ color: theme.colors.text }}
                      title={result.onChain.txHash}
                    >
                      {result.onChain.txHash}
                    </p>
                  </div>
                  <div>
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Block
                    </span>
                    <p
                      className="font-mono text-xs"
                      style={{ color: theme.colors.text }}
                    >
                      #{result.onChain.blockHeight}
                    </p>
                  </div>
                </div>
                <a
                  href={result.onChain.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 mt-4 text-sm rounded-lg border transition-colors hover:bg-white/5"
                  style={{
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                >
                  <ExternalLink size={14} /> View on Casper Explorer
                </a>
              </div>

              {!result.verified && (
                <div
                  className={`flex items-start gap-3 p-4 ${theme.ui.radius}`}
                  style={{ backgroundColor: theme.colors.warning + "10" }}
                >
                  <AlertTriangle
                    size={18}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: theme.colors.warning }}
                  />
                  <p className="text-sm" style={{ color: theme.colors.text }}>
                    {result.chainStatus === "rpc_error" || result.chainStatus === "parse_failed"
                      ? (result.details.rpcParseError
                          ? `Verification failed: ${result.details.rpcParseError}`
                          : "Verification failed: chain is temporarily unavailable. Try again.")
                      : result.chainStatus === "not_found"
                        ? "Verification failed: this transaction was not found on Casper Testnet."
                        : !result.details.inputMatch && !result.details.outputMatch
                          ? "Both input and output data have been modified since this decision was recorded on-chain."
                          : !result.details.inputMatch
                            ? "The input data has been modified since this decision was recorded on-chain."
                            : "The output data has been modified since this decision was recorded on-chain."}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HashRow({
  label,
  onChain,
  computed,
  match,
}: {
  label: string;
  onChain: string;
  computed: string;
  match: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg`}
      style={{ backgroundColor: theme.colors.surfaceAlt }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs uppercase tracking-wider font-medium"
          style={{ color: theme.colors.textMuted }}
        >
          {label}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium">
          {match ? (
            <>
              <CheckCircle size={14} style={{ color: theme.colors.success }} />
              <span style={{ color: theme.colors.success }}>Match</span>
            </>
          ) : (
            <>
              <XCircle size={14} style={{ color: theme.colors.error }} />
              <span style={{ color: theme.colors.error }}>Mismatch</span>
            </>
          )}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs flex-shrink-0 w-16"
            style={{ color: theme.colors.textMuted }}
          >
            On-chain
          </span>
          <span
            className="text-xs font-mono truncate"
            style={{ color: theme.colors.text }}
            title={onChain}
          >
            {onChain}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs flex-shrink-0 w-16"
            style={{ color: theme.colors.textMuted }}
          >
            Computed
          </span>
          <span
            className="text-xs font-mono truncate"
            style={{
              color: match ? theme.colors.text : theme.colors.error,
            }}
            title={computed}
          >
            {computed}
          </span>
        </div>
      </div>
    </div>
  );
}
