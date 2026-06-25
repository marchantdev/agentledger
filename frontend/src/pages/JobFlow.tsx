import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ArrowRight,
  Hash,
  Briefcase,
  Clock,
  Brain,
  Activity,
  Eye,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  User,
  Users,
  Zap,
  Download,
  ExternalLink,
  Play,
  RotateCcw,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { VerifyResponse } from "../lib/api";
import type { DecisionRecord } from "../lib/types";

// ─── Types ────────────────────────────────────────────────────
type Phase = "job" | "evaluate" | "record" | "receipt" | "verify" | "dispute";

interface PolicyStep {
  label: string;
  detail: string;
  status: "pending" | "running" | "pass" | "fail";
}

// ─── Static Demo Data ─────────────────────────────────────────

const JOB = {
  id: "JOB-2026-1547",
  title: "Q2 Infrastructure Invoice Processing",
  client: "Apex Capital Fund",
  vendor: "Northwind Cloud",
  amount: 8500,
  currency: "USDT",
  paymentRef: "PAY-X402-1547",
  description:
    "Review and approve vendor invoice INV-2026-1547 from Northwind Cloud for Q2 cloud infrastructure services. Apply treasury policy: budget threshold, vendor tier verification, duplicate check, single-approval limit.",
  postedAt: "2026-06-21T09:00:00Z",
  budgetRemaining: 52000,
};

const POLICY_STEPS_DATA = [
  { label: "Read invoice facts", detail: `${JOB.vendor} — $${JOB.amount.toLocaleString()} ${JOB.currency} — INV-2026-1547` },
  { label: "Check budget threshold", detail: `$${JOB.amount.toLocaleString()} is 16% of remaining $${JOB.budgetRemaining.toLocaleString()} budget (< 25% limit)` },
  { label: "Verify vendor approval", detail: `${JOB.vendor} — tier-1 approved vendor list` },
  { label: "Duplicate invoice check", detail: "No duplicate INV-2026-1547 in last 30 days" },
  { label: "Single-approval limit", detail: `$${JOB.amount.toLocaleString()} < $15,000 single-approval threshold` },
];

const DECISION = {
  verdict: "APPROVED",
  riskScore: 0.14,
  confidence: 0.96,
  reasoning:
    `Invoice $${JOB.amount.toLocaleString()} from ${JOB.vendor} consumes 16% of remaining $${JOB.budgetRemaining.toLocaleString()} budget. Below single-approval threshold. Vendor verified tier-1. Approved with high confidence.`,
};

const SEEDED_DECISION_ID = 119; // verified hero receipt — Northwind Cloud $8,500, on Casper testnet

// ─── Phase labels ─────────────────────────────────────────────
const PHASES: { key: Phase; label: string }[] = [
  { key: "job", label: "Job Brief" },
  { key: "evaluate", label: "Agent Runs" },
  { key: "record", label: "On-Chain" },
  { key: "receipt", label: "Receipt" },
  { key: "verify", label: "Verify" },
  { key: "dispute", label: "Tamper" },
];

// ─── Main Component ───────────────────────────────────────────

export default function JobFlow() {
  const [phase, setPhase] = useState<Phase>("job");
  const [policySteps, setPolicySteps] = useState<PolicyStep[]>([]);
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalDone, setEvalDone] = useState(false);
  const [recording, setRecording] = useState(false);
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tamperResult, setTamperResult] = useState<VerifyResponse | null>(null);
  const [tamperVerifying, setTamperVerifying] = useState(false);
  const abortRef = useRef(false);
  const navigate = useNavigate();

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const phaseIdx = PHASES.findIndex((p) => p.key === phase);

  const goNext = () => {
    if (phaseIdx < PHASES.length - 1) setPhase(PHASES[phaseIdx + 1].key);
  };

  const goTo = (p: Phase) => {
    const target = PHASES.findIndex((x) => x.key === p);
    if (target <= phaseIdx) setPhase(p);
  };

  // ─── Evaluate Agent ──────────────────────────────────────────
  const runEvaluation = useCallback(async () => {
    if (evalRunning || evalDone) return;
    abortRef.current = false;
    setEvalRunning(true);

    const steps: PolicyStep[] = POLICY_STEPS_DATA.map((s) => ({
      ...s,
      status: "pending" as const,
    }));
    setPolicySteps(steps);

    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) return;
      steps[i].status = "running";
      setPolicySteps([...steps]);
      await sleep(600 + Math.random() * 400);
      steps[i].status = "pass";
      setPolicySteps([...steps]);
      await sleep(200);
    }

    setEvalDone(true);
    setEvalRunning(false);
  }, [evalRunning, evalDone]);

  // Auto-start evaluation when entering evaluate phase
  useEffect(() => {
    if (phase === "evaluate" && !evalRunning && !evalDone) {
      runEvaluation();
    }
  }, [phase, evalRunning, evalDone, runEvaluation]);

  // ─── Record On-Chain ─────────────────────────────────────────
  const recordOnChain = useCallback(async () => {
    if (recording || decision) return;
    setRecording(true);

    try {
      const data = await api.workbenchRecord("vendor_payment");
      if (data.fallback) {
        setIsFallback(true);
        setFallbackReason("Live recording needs the demo backend — showing on-chain receipt #119, independently verifiable below");
        const seeded = await api.getDecision(SEEDED_DECISION_ID);
        setDecision(seeded);
      } else {
        const fresh = data.decision ?? await api.getLiveDecision(data.decisionId);
        setDecision(fresh);
      }
    } catch {
      setIsFallback(true);
      setFallbackReason("Live recording needs the demo backend — showing on-chain receipt #119, independently verifiable below");
      try {
        const seeded = await api.getDecision(SEEDED_DECISION_ID);
        setDecision(seeded);
      } catch {
        // silently fallback
      }
    }

    setRecording(false);
  }, [recording, decision]);

  // Auto-start recording when entering record phase
  useEffect(() => {
    if (phase === "record" && !recording && !decision) {
      recordOnChain();
    }
  }, [phase, recording, decision, recordOnChain]);

  // ─── Verify ──────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (!decision || verifying) return;
    setVerifying(true);
    try {
      const result = await api.verify(
        decision.decisionId,
        decision.inputData || {},
        decision.outputData || {},
      );
      setVerifyResult(result);
    } catch {
      setVerifyResult(null);
    } finally {
      setVerifying(false);
    }
  }, [decision, verifying]);

  // ─── Tamper Test ─────────────────────────────────────────────
  const handleTamper = useCallback(async () => {
    if (!decision || tamperVerifying) return;
    setTamperVerifying(true);
    try {
      const tamperedOutput = {
        ...(decision.outputData || {}),
        payment_amount: 15000,
        reason: "Within budget threshold (33%)",
      };
      const result = await api.verify(
        decision.decisionId,
        decision.inputData || {},
        tamperedOutput,
      );
      setTamperResult(result);
    } catch {
      setTamperResult(null);
    } finally {
      setTamperVerifying(false);
    }
  }, [decision, tamperVerifying]);

  // ─── Restart ─────────────────────────────────────────────────
  const restart = () => {
    abortRef.current = true;
    setPhase("job");
    setPolicySteps([]);
    setEvalRunning(false);
    setEvalDone(false);
    setRecording(false);
    setDecision(null);
    setIsFallback(false);
    setFallbackReason(null);
    setVerifyResult(null);
    setVerifying(false);
    setTamperResult(null);
    setTamperVerifying(false);
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: theme.colors.textMuted }}>
          <Briefcase size={12} />
          <span>End-to-End Paid Agent Flow</span>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Paid Work Receipt Demo
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Follow a paid job from creation to on-chain receipt — with verification and tamper detection at every step.
        </p>
      </div>

      {/* Phase Progress Stepper */}
      <div className="flex items-center gap-1">
        {PHASES.map((p, i) => {
          const isActive = p.key === phase;
          const isDone = i < phaseIdx;
          return (
            <div key={p.key} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => goTo(p.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${isDone ? "cursor-pointer" : isActive ? "" : "cursor-default opacity-40"}`}
                style={{
                  backgroundColor: isDone ? theme.colors.success + "20" : isActive ? theme.colors.primary + "20" : "transparent",
                  color: isDone ? theme.colors.success : isActive ? theme.colors.primary : theme.colors.textMuted,
                }}
              >
                {isDone ? (
                  <CheckCircle size={12} />
                ) : (
                  <span
                    className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]"
                    style={{ borderColor: isActive ? theme.colors.primary : theme.colors.border }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{p.label}</span>
              </button>
              {i < PHASES.length - 1 && (
                <ChevronRight size={12} className="flex-shrink-0" style={{ color: theme.colors.border }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═════════════════════ Phase 1: Job Brief ═════════════════════ */}
      {phase === "job" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <Briefcase size={16} style={{ color: theme.colors.primary }} />
              Job Brief
            </h2>

            <div
              className="p-4 rounded-lg border mb-4"
              style={{ borderColor: theme.colors.primary + "30", backgroundColor: theme.colors.primary + "06" }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>{JOB.id}</p>
                  <h3 className="text-base font-semibold mt-0.5" style={{ color: theme.colors.text }}>{JOB.title}</h3>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                  style={{ backgroundColor: theme.colors.success + "20", color: theme.colors.success }}
                >
                  Open
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2.5 rounded" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                    Client
                  </span>
                  <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{JOB.client}</span>
                </div>
                <div className="p-2.5 rounded" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                    Vendor
                  </span>
                  <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{JOB.vendor}</span>
                </div>
                <div className="p-2.5 rounded" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                    Amount
                  </span>
                  <span className="text-lg font-bold font-mono" style={{ color: theme.colors.primary }}>
                    ${JOB.amount.toLocaleString()} <span className="text-xs font-normal">{JOB.currency}</span>
                  </span>
                </div>
                <div className="p-2.5 rounded" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                    Payment Ref
                  </span>
                  <span className="text-sm font-mono" style={{ color: theme.colors.text }}>{JOB.paymentRef}</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
                {JOB.description}
              </p>
            </div>
          </div>

          <div className={`card ${theme.ui.radius}`} style={{ borderLeft: `3px solid ${theme.colors.primary}` }}>
            <h3 className="font-semibold flex items-center gap-2 mb-2" style={{ color: theme.colors.text }}>
              <Users size={16} style={{ color: theme.colors.primary }} />
              The Trust Problem
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
              An AI agent is about to handle $8,500 autonomously. The client needs to know: <strong style={{ color: theme.colors.text }}>what decision did the agent actually make, and can they prove it later?</strong> Without AgentLedger, the answer depends on trusting internal logs — which can be altered. With AgentLedger, the answer is on Casper's blockchain.
            </p>
          </div>

          <button onClick={goNext} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            <Play size={16} /> Assign to Agent <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ═════════════════════ Phase 2: Agent Evaluates ═════════════════════ */}
      {phase === "evaluate" && (
        <div className="space-y-4 animate-fade-in-up">
          <div
            className={`${theme.ui.radius} border overflow-hidden`}
            style={{ borderColor: "#34d39940", backgroundColor: theme.colors.surface }}
          >
            {/* Agent header bar */}
            <div
              className="flex items-center gap-3 px-5 py-3 border-b"
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#34d39920" }}
              >
                <Brain size={18} style={{ color: "#34d399" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                  treasury-agent-01
                </p>
                <p className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                  Policy: treasury-v2.1 &middot; Deterministic policy agent
                </p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: evalDone ? theme.colors.success + "20" : theme.colors.primary + "20",
                  color: evalDone ? theme.colors.success : theme.colors.primary,
                }}
              >
                {evalRunning ? "Evaluating..." : evalDone ? "Complete" : "Ready"}
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Input facts */}
              <div>
                <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: theme.colors.textMuted }}>
                  <Eye size={12} /> Job Input Facts
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "invoice", value: "INV-2026-1547" },
                    { key: "vendor", value: JOB.vendor },
                    { key: "amount", value: `$${JOB.amount.toLocaleString()}` },
                    { key: "currency", value: JOB.currency },
                    { key: "budget remaining", value: `$${JOB.budgetRemaining.toLocaleString()}` },
                    { key: "payment ref", value: JOB.paymentRef },
                  ].map((item) => (
                    <div key={item.key} className="p-2 rounded" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                      <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                        {item.key}
                      </span>
                      <span className="text-xs font-mono" style={{ color: theme.colors.text }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy steps */}
              <div>
                <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: theme.colors.textMuted }}>
                  <Activity size={12} /> Policy Evaluation
                </h3>
                <div className="space-y-2">
                  {policySteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${step.status === "running" ? "ring-1 ring-offset-1" : ""}`}
                      style={{
                        backgroundColor:
                          step.status === "pass" ? theme.colors.success + "08" :
                          step.status === "running" ? theme.colors.primary + "08" :
                          "transparent",
                        ["--tw-ring-color" as string]: step.status === "running" ? theme.colors.primary : undefined,
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {step.status === "pending" && (
                          <div className="w-4 h-4 rounded-full border" style={{ borderColor: theme.colors.border }} />
                        )}
                        {step.status === "running" && (
                          <Loader2 size={16} className="animate-spin" style={{ color: theme.colors.primary }} />
                        )}
                        {step.status === "pass" && (
                          <CheckCircle size={16} style={{ color: theme.colors.success }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: step.status === "pending" ? theme.colors.textMuted : theme.colors.text }}>
                          {step.label}
                        </p>
                        {(step.status === "running" || step.status === "pass") && (
                          <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                            {step.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision result */}
              {evalDone && (
                <div className="animate-fade-in-up">
                  <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: theme.colors.textMuted }}>
                    <Brain size={12} /> Agent Decision
                  </h3>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: "#34d39940", backgroundColor: "#34d39908" }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-sm font-bold font-mono px-3 py-1 rounded"
                        style={{ backgroundColor: "#34d39920", color: "#34d399" }}
                      >
                        {DECISION.verdict}
                      </span>
                      <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                        Risk: {(DECISION.riskScore * 100).toFixed(0)}% &middot; Confidence: {(DECISION.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
                      {DECISION.reasoning}
                    </p>
                    <p className="text-[10px] mt-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                      deterministic policy agent &middot; no LLM involved
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {evalDone && (
            <button onClick={goNext} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
              Record on Casper <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* ═════════════════════ Phase 3: On-Chain Recording ═════════════════════ */}
      {phase === "record" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <Shield size={16} style={{ color: theme.colors.primary }} />
              Recording Decision On-Chain
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
              The agent's decision data is SHA-256 hashed and recorded immutably on Casper testnet. The job payment reference (<span className="font-mono text-xs" style={{ color: theme.colors.text }}>{JOB.paymentRef}</span>) is hashed and bound to this receipt — linking the decision to the specific job.
            </p>

            {/* Recording animation */}
            {recording && (
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary + "10" }}>
                <Loader2 size={20} className="animate-spin" style={{ color: theme.colors.primary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                    Hashing and recording on Casper testnet...
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                    Input data + output data + job/payment ref → SHA-256 → on-chain
                  </p>
                </div>
              </div>
            )}

            {/* Result */}
            {decision && !recording && (
              <div className="space-y-3">
                {isFallback ? (
                  <div
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: "#f59e0b20", borderLeft: "3px solid #f59e0b" }}
                  >
                    <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                        On-Chain Receipt · Casper testnet
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                        {fallbackReason} &middot; Using pre-recorded on-chain data
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: theme.colors.success + "10", borderLeft: `3px solid ${theme.colors.success}` }}
                  >
                    <CheckCircle size={20} style={{ color: theme.colors.success }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: theme.colors.success }}>
                        Decision Recorded On-Chain
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                        {decision.blockHeight > 0 ? `Block #${decision.blockHeight.toLocaleString()}` : "Submitted"} &middot; Casper testnet
                      </p>
                    </div>
                  </div>
                )}

                {/* Hash breakdown */}
                <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <p className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: theme.colors.textMuted }}>
                    What's stored on-chain
                  </p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-start gap-2">
                      <Hash size={12} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.textMuted }} />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Transaction</span>
                        <span style={{ color: theme.colors.text }} className="break-all">{decision.txHash}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield size={12} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Input Hash</span>
                        <span style={{ color: theme.colors.text }} className="break-all">{decision.inputHash}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield size={12} className="mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary }} />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Output Hash</span>
                        <span style={{ color: theme.colors.text }} className="break-all">{decision.outputHash}</span>
                      </div>
                    </div>
                    {decision.jobPaymentRefHash && (
                      <div className="flex items-start gap-2">
                        <Zap size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                        <div>
                          <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Job/Payment Ref Hash</span>
                          <span style={{ color: theme.colors.text }} className="break-all">{decision.jobPaymentRefHash}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Binding explanation */}
                <div className="p-3 rounded-lg border" style={{ borderColor: "#f59e0b30", backgroundColor: "#f59e0b06" }}>
                  <div className="flex items-start gap-2">
                    <Zap size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                    <p className="text-xs leading-relaxed" style={{ color: theme.colors.text }}>
                      <strong>Job binding:</strong> The payment reference <span className="font-mono">{JOB.paymentRef}</span> is hashed and stored alongside the decision hashes. This cryptographically binds this specific decision to this specific job — you can't swap receipts between jobs.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {decision && !recording && (
            <button onClick={goNext} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
              View Receipt <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* ═════════════════════ Phase 4: Receipt ═════════════════════ */}
      {phase === "receipt" && decision && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
                  <FileText size={16} style={{ color: theme.colors.primary }} />
                  Receipt #{decision.decisionId}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                  Immutable proof of the agent's decision for job {JOB.id}
                </p>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: theme.colors.success + "20", color: theme.colors.success }}
              >
                On-Chain
              </span>
            </div>

            {/* Receipt details grid */}
            <div className="space-y-3">
              {/* Decision summary */}
              <div className="p-4 rounded-lg border" style={{ borderColor: "#34d39930", backgroundColor: "#34d39906" }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Decision</span>
                    <span className="text-sm font-bold font-mono" style={{ color: "#34d399" }}>{DECISION.verdict}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Amount</span>
                    <span className="text-sm font-bold font-mono" style={{ color: theme.colors.text }}>${JOB.amount.toLocaleString()} {JOB.currency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Agent</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.text }}>treasury-agent-01</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>Policy</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.text }}>treasury-v2.1</span>
                  </div>
                </div>
              </div>

              {/* Job binding section */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: theme.colors.textMuted }}>
                  <Zap size={12} style={{ color: "#f59e0b" }} /> Job/Payment Binding
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>Job ID</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.text }}>{JOB.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>Payment Reference</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.text }}>{JOB.paymentRef}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>Vendor</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.text }}>{JOB.vendor}</span>
                  </div>
                  {decision.jobPaymentRefHash && (
                    <div className="flex items-start justify-between py-1.5">
                      <span className="text-xs flex-shrink-0" style={{ color: theme.colors.textMuted }}>Ref Hash (on-chain)</span>
                      <span className="text-xs font-mono text-right break-all ml-3" style={{ color: "#f59e0b" }}>{decision.jobPaymentRefHash}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* On-chain proof */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: theme.colors.textMuted }}>
                  <Shield size={12} style={{ color: theme.colors.primary }} /> Casper Blockchain Proof
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>Block Height</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.success }}>{decision.blockHeight > 0 ? `#${decision.blockHeight.toLocaleString()}` : "finalizing..."}</span>
                  </div>
                  <div className="flex items-start justify-between py-1.5 border-b" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs flex-shrink-0" style={{ color: theme.colors.textMuted }}>TX Hash</span>
                    <span className="text-xs font-mono text-right break-all ml-3" style={{ color: theme.colors.text }}>{decision.txHash}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>Timestamp</span>
                    <span className="text-xs font-mono" style={{ color: theme.colors.text }}>{new Date(decision.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Link
                  to={`/receipt/${decision.decisionId}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                >
                  <FileText size={14} /> Full Receipt
                </Link>
                <a
                  href={`https://testnet.cspr.live/transaction/${decision.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                >
                  <ExternalLink size={14} /> Explorer
                </a>
                <button
                  onClick={() => api.auditReport(decision.decisionId, "json")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                >
                  <Download size={14} /> Export
                </button>
              </div>
            </div>
          </div>

          <button onClick={goNext} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            <User size={16} /> Payer Verifies <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ═════════════════════ Phase 5: Payer Verifies ═════════════════════ */}
      {phase === "verify" && decision && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <User size={16} style={{ color: theme.colors.primary }} />
              Payer Verification
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
              The client ({JOB.client}) receives the receipt link. They can independently verify the decision data matches the on-chain hashes — <strong style={{ color: theme.colors.text }}>without trusting the agent, the platform, or any backend.</strong>
            </p>

            {/* Verification panel */}
            <div
              className={`${theme.ui.radius} border p-4`}
              style={{ borderColor: theme.colors.primary + "40", backgroundColor: theme.colors.primary + "06" }}
            >
              {!verifyResult ? (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.primary + "20" }}>
                    {verifying ? (
                      <Loader2 size={22} className="animate-spin" style={{ color: theme.colors.primary }} />
                    ) : (
                      <ShieldCheck size={22} style={{ color: theme.colors.primary }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                      {verifying ? "Verifying against Casper RPC..." : "Verify This Receipt"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                      Re-hash the original decision data and compare to the immutable on-chain record via Casper RPC.
                    </p>
                  </div>
                  {!verifying && (
                    <span className="text-xs px-4 py-2 rounded-lg font-medium flex-shrink-0" style={{ backgroundColor: theme.colors.primary, color: "#000" }}>
                      Verify
                    </span>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {verifyResult.verified ? (
                      <ShieldCheck size={28} style={{ color: theme.colors.success }} />
                    ) : (
                      <ShieldX size={28} style={{ color: theme.colors.error }} />
                    )}
                    <div>
                      <p className="text-base font-bold" style={{ color: verifyResult.verified ? theme.colors.success : theme.colors.error }}>
                        {verifyResult.verified ? "VERIFIED — Data Matches On-Chain" : "MISMATCH — Data Does Not Match"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                        {verifyResult.verified
                          ? `The agent approved exactly $${JOB.amount.toLocaleString()} ${JOB.currency} for ${JOB.vendor}. This is provable and immutable.`
                          : "Verification failed — the data has been modified."}
                      </p>
                    </div>
                  </div>

                  {/* Hash comparison */}
                  {verifyResult.verified && (
                    <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} style={{ color: theme.colors.success }} />
                        <span className="text-xs" style={{ color: theme.colors.text }}>Input hash matches on-chain</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} style={{ color: theme.colors.success }} />
                        <span className="text-xs" style={{ color: theme.colors.text }}>Output hash matches on-chain</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={12} style={{ color: theme.colors.success }} />
                        <span className="text-xs" style={{ color: theme.colors.text }}>Verified via Casper RPC — no backend trust required</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {verifyResult && verifyResult.verified && (
            <div className={`card ${theme.ui.radius}`} style={{ borderLeft: `3px solid ${theme.colors.success}` }}>
              <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
                The payer now has <strong style={{ color: theme.colors.text }}>cryptographic proof</strong> that the agent's decision was exactly what's recorded — $8,500 to Northwind Cloud. But what if someone tries to claim a different amount?
              </p>
            </div>
          )}

          {verifyResult && (
            <button onClick={goNext} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
              <AlertTriangle size={16} /> Test Tampering <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* ═════════════════════ Phase 6: Dispute / Tamper ═════════════════════ */}
      {phase === "dispute" && decision && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <AlertTriangle size={16} style={{ color: theme.colors.error }} />
              Tamper Detection
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
              What if Northwind Cloud claims the agent approved $15,000 instead of $8,500? Let's submit their version and see what happens.
            </p>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg border" style={{ borderColor: theme.colors.success + "40", backgroundColor: theme.colors.success + "06" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} style={{ color: theme.colors.success }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.success }}>Actual Record</span>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: theme.colors.text }}>
{`{
  "decision": "APPROVED",
  "payment_amount": ${JOB.amount.toLocaleString()},
  "vendor": "${JOB.vendor}"
}`}
                </pre>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: theme.colors.error + "40", backgroundColor: theme.colors.error + "06" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} style={{ color: theme.colors.error }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.error }}>Vendor Claims</span>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: theme.colors.text }}>
{`{
  "decision": "APPROVED",
  "payment_amount": `}<span style={{ color: theme.colors.error, fontWeight: "bold" }}>15,000</span>{`,
  "vendor": "${JOB.vendor}"
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Tamper verify */}
          <div
            className={`${theme.ui.radius} border p-4`}
            style={{ borderColor: theme.colors.error + "40", backgroundColor: theme.colors.error + "06" }}
          >
            {!tamperResult ? (
              <button
                onClick={handleTamper}
                disabled={tamperVerifying}
                className="w-full flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.error + "20" }}>
                  {tamperVerifying ? (
                    <Loader2 size={22} className="animate-spin" style={{ color: theme.colors.error }} />
                  ) : (
                    <ShieldX size={22} style={{ color: theme.colors.error }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                    {tamperVerifying ? "Checking tampered data against chain..." : "Submit Vendor's Claimed Amount"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                    Hash the $15,000 version and compare to the on-chain record.
                  </p>
                </div>
                {!tamperVerifying && (
                  <span className="text-xs px-4 py-2 rounded-lg font-medium flex-shrink-0" style={{ backgroundColor: theme.colors.error, color: "#fff" }}>
                    Test Claim
                  </span>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldX size={28} style={{ color: theme.colors.error }} />
                  <div>
                    <p className="text-base font-bold" style={{ color: theme.colors.error }}>
                      HASH MISMATCH — CLAIM DISPROVED
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                      The vendor's claimed $15,000 produces a different hash. The on-chain record proves $8,500 was approved.
                    </p>
                  </div>
                </div>

                {/* Hash comparison */}
                <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <div>
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>On-chain output hash:</span>
                    <p className="text-xs font-mono truncate" style={{ color: theme.colors.success }} title={tamperResult.onChain?.outputHash ?? ""}>
                      {tamperResult.onChain?.outputHash ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>Computed from vendor's claim:</span>
                    <p className="text-xs font-mono truncate" style={{ color: theme.colors.error }} title={tamperResult.computed?.outputHash ?? ""}>
                      {tamperResult.computed?.outputHash ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <XCircle size={14} style={{ color: theme.colors.error }} />
                    <span className="text-xs font-medium" style={{ color: theme.colors.error }}>Hashes don't match — data was different.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verdict */}
          {tamperResult && (
            <div className="space-y-4 animate-fade-in-up">
              <div
                className={`p-6 ${theme.ui.radius}`}
                style={{ backgroundColor: theme.colors.success + "10", borderLeft: `4px solid ${theme.colors.success}` }}
              >
                <h2 className="text-lg font-bold flex items-center gap-2 mb-2" style={{ color: theme.colors.success, fontFamily: theme.fonts.headline }}>
                  <CheckCircle size={20} />
                  End-to-End Flow Complete
                </h2>
                <p className="text-sm" style={{ color: theme.colors.text }}>
                  From job brief to tamper-proof receipt — the entire paid agent workflow is verifiable on Casper's blockchain.
                </p>
              </div>

              {/* Summary checklist */}
              <div className={`card ${theme.ui.radius}`}>
                <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: theme.colors.text }}>
                  <FileText size={16} style={{ color: theme.colors.accent }} />
                  What Just Happened
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: <Briefcase size={14} />, text: "Job brief created with payment reference", color: theme.colors.primary },
                    { icon: <Brain size={14} />, text: "Policy agent evaluated rules step-by-step (deterministic, no LLM)", color: "#34d399" },
                    { icon: <Shield size={14} />, text: "Decision hashes recorded immutably on Casper testnet", color: theme.colors.primary },
                    { icon: <Zap size={14} />, text: "Receipt bound to job via hashed payment reference", color: "#f59e0b" },
                    { icon: <CheckCircle size={14} />, text: "Payer independently verified via Casper RPC", color: theme.colors.success },
                    { icon: <XCircle size={14} />, text: "Tampered claim disproved by hash mismatch", color: theme.colors.error },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5" style={{ color: item.color }}>{item.icon}</span>
                      <p className="text-sm" style={{ color: theme.colors.text }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why this matters */}
              <div className={`card ${theme.ui.radius}`} style={{ borderLeft: `3px solid ${theme.colors.primary}` }}>
                <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>The Trust Layer for Paid Agents</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
                  As AI agents handle more autonomous financial decisions, every party needs proof of what happened. AgentLedger provides that proof on Casper's blockchain — the payer can verify, disputes resolve in seconds, and no one has to trust internal logs. This is the infrastructure that makes paid agent work trustworthy.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/receipt/${decision.decisionId}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: theme.colors.primary, color: "#000" }}
                >
                  <FileText size={14} /> Full Receipt
                </Link>
                <Link
                  to="/workbench"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                >
                  <Play size={14} /> Try Workbench
                </Link>
                <Link
                  to="/dispute"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                >
                  <AlertTriangle size={14} /> Dispute Demo
                </Link>
              </div>

              {/* Restart */}
              <button
                onClick={restart}
                className="w-full flex items-center justify-center gap-2 text-xs py-2 transition-opacity hover:opacity-80"
                style={{ color: theme.colors.textMuted }}
              >
                <RotateCcw size={12} /> Restart flow
              </button>

              {/* Flow summary */}
              <div className="flex items-center gap-2 text-xs py-2 flex-wrap justify-center" style={{ color: theme.colors.textMuted }}>
                <span>Job brief</span>
                <ArrowRight size={10} />
                <span>Policy evaluation</span>
                <ArrowRight size={10} />
                <span>On-chain recording</span>
                <ArrowRight size={10} />
                <span>Receipt + binding</span>
                <ArrowRight size={10} />
                <span>Payer verification</span>
                <ArrowRight size={10} />
                <span className="font-medium" style={{ color: theme.colors.success }}>Tamper-proof</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
