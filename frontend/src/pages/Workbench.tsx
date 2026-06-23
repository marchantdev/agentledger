import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  CheckCircle,
  Loader2,
  FileText,
  Shield,
  AlertTriangle,
  ExternalLink,
  Hash,
  Briefcase,
  TrendingUp,
  AlertOctagon,
  Play,
  Clock,
  Brain,
  Activity,
  ChevronRight,
  Eye,
  ArrowRight,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { DecisionRecord } from "../lib/types";

/** Policy evaluation steps shown during agent run */
interface PolicyStep {
  label: string;
  detail: string;
  status: "pending" | "running" | "pass" | "fail";
}

/** Scenario definitions with embedded policy logic for visible evaluation */
const SCENARIOS = [
  {
    id: "vendor_payment",
    label: "Vendor Payment Approval",
    icon: Briefcase,
    color: "#34d399",
    description: "Treasury agent reviews invoice against budget threshold, approves $10,000 payment to CloudServ Inc.",
    agentId: "treasury-agent-01",
    policyVersion: "treasury-v2.1",
    inputFacts: {
      invoice_id: "INV-2026-0847",
      vendor: "CloudServ Inc",
      amount: 10000,
      currency: "USDT",
      budget_remaining: 45000,
    },
    policySteps: [
      { label: "Read invoice facts", detail: "INV-2026-0847 — CloudServ Inc — $10,000 USDT" },
      { label: "Check budget threshold", detail: "Invoice $10,000 is 22% of remaining $45,000 budget (< 25% limit)" },
      { label: "Verify vendor approval", detail: "CloudServ Inc — tier-1 approved vendor list" },
      { label: "Duplicate invoice check", detail: "No duplicate INV-2026-0847 in last 30 days" },
      { label: "Single-approval limit", detail: "$10,000 < $15,000 single-approval threshold" },
    ],
    decision: "APPROVED",
    riskScore: 0.18,
    reasoning: "Invoice $10,000 from CloudServ Inc consumes 22% of remaining $45,000 budget. Below single-approval threshold. Vendor verified tier-1. Approved with high confidence.",
    seededDecisionId: 0,
  },
  {
    id: "defi_swap",
    label: "DeFi Token Swap",
    icon: TrendingUp,
    color: "#60a5fa",
    description: "Trading agent evaluates CSPR/USDT market signal and executes a $5,000 buy order.",
    agentId: "trading-agent-03",
    policyVersion: "trading-v3.0",
    inputFacts: {
      pair: "CSPR/USDT",
      side: "BUY",
      amount: 5000,
      limit_price: 0.042,
      slippage_tolerance: 0.005,
    },
    policySteps: [
      { label: "Analyze market signal", detail: "MACD crossover + volume spike — bullish breakout detected" },
      { label: "Check price limits", detail: "Limit $0.042, fill price $0.0418 — within range" },
      { label: "Validate slippage", detail: "Slippage 0.48% within 0.5% tolerance" },
      { label: "Position sizing check", detail: "$5,000 is 5% of portfolio — below 10% concentration max" },
    ],
    decision: "EXECUTED",
    riskScore: 0.32,
    reasoning: "Bullish breakout signal on CSPR/USDT. Buy $5,000 at limit $0.042 — filled at $0.0418 (0.48% slippage). Position size 5% of portfolio.",
    seededDecisionId: 3,
  },
  {
    id: "risk_alert",
    label: "Risk Alert",
    icon: AlertOctagon,
    color: "#f87171",
    description: "Risk monitor detects portfolio drawdown exceeding volatility threshold, flags exposure reduction.",
    agentId: "risk-monitor-02",
    policyVersion: "risk-monitor-v1.3",
    inputFacts: {
      asset: "CSPR/USDT",
      volatility_24h: 0.087,
      threshold: 0.05,
      position_size: 25000,
    },
    policySteps: [
      { label: "Measure realized volatility", detail: "24h realized vol: 8.7% on CSPR/USDT" },
      { label: "Compare to threshold", detail: "8.7% exceeds 5% policy threshold by 74%" },
      { label: "Check position exposure", detail: "$25,000 position above $10,000 minimum alert threshold" },
      { label: "Scan for hedges", detail: "No offsetting hedge detected in portfolio" },
    ],
    decision: "HIGH ALERT — REDUCE EXPOSURE",
    riskScore: 0.74,
    reasoning: "CSPR/USDT 24h volatility at 8.7% — 74% above the 5% threshold. Position $25K with no hedge. Recommending 40% exposure reduction.",
    seededDecisionId: 2,
  },
];

const SCENARIO_META: Record<string, { label: string; icon: any; color: string }> = {
  vendor_payment_approval: { label: "Vendor Payment", icon: Briefcase, color: "#34d399" },
  payment_rejection: { label: "Payment Rejection", icon: AlertTriangle, color: "#fb923c" },
  risk_alert: { label: "Risk Alert", icon: AlertOctagon, color: "#f87171" },
  swap: { label: "DeFi Swap", icon: TrendingUp, color: "#60a5fa" },
  rebalance: { label: "Portfolio Rebalance", icon: Zap, color: "#a78bfa" },
};

type RunPhase = "idle" | "evaluating" | "decision" | "recording" | "done";

export default function Workbench() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Agent run state
  const [activeScenario, setActiveScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [runPhase, setRunPhase] = useState<RunPhase>("idle");
  const [policySteps, setPolicySteps] = useState<PolicyStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<DecisionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const abortRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDecisions()
      .then((res) => setDecisions(res.decisions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runAgent = useCallback(async (scenario: typeof SCENARIOS[0]) => {
    abortRef.current = false;
    setActiveScenario(scenario);
    setResult(null);
    setError(null);
    setIsFallback(false);
    setFallbackReason(null);
    setCurrentStep(-1);

    // Initialize policy steps
    const steps: PolicyStep[] = scenario.policySteps.map((s) => ({
      label: s.label,
      detail: s.detail,
      status: "pending" as const,
    }));
    setPolicySteps(steps);
    setRunPhase("evaluating");

    // Animate through each step
    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) return;
      setCurrentStep(i);
      steps[i].status = "running";
      setPolicySteps([...steps]);
      await sleep(600 + Math.random() * 400);
      steps[i].status = "pass";
      setPolicySteps([...steps]);
      await sleep(200);
    }

    // Show decision
    setRunPhase("decision");
    await sleep(1200);

    // Recording phase — try live API first, fall back to seeded data
    setRunPhase("recording");
    try {
      const data = await api.workbenchRecord(scenario.id);
      if (data.fallback) {
        // Backend returned a seeded fallback — show read-only state
        setIsFallback(true);
        setFallbackReason(data.fallbackReason || "Live recording unavailable");
        const seeded = await api.getDecision(scenario.seededDecisionId);
        setResult(seeded);
      } else {
        // Live recording succeeded
        const fresh = await api.getDecision(data.decisionId);
        setResult(fresh);
      }
    } catch {
      // Network error — fall back to seeded decision
      setIsFallback(true);
      setFallbackReason("Live recording unavailable — showing demo data");
      try {
        const seeded = await api.getDecision(scenario.seededDecisionId);
        setResult(seeded);
      } catch {
        setError("Could not load decision data");
      }
    }

    setRunPhase("done");
  }, []);

  const resetRun = () => {
    abortRef.current = true;
    setActiveScenario(null);
    setRunPhase("idle");
    setPolicySteps([]);
    setCurrentStep(-1);
    setResult(null);
    setError(null);
    setIsFallback(false);
    setFallbackReason(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Agent Workbench
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Run a demo policy agent, watch it evaluate rules, and see its decision recorded on Casper testnet.
        </p>
      </div>

      {/* Agent run visualization */}
      {activeScenario && runPhase !== "idle" && (
        <AgentRunPanel
          scenario={activeScenario}
          runPhase={runPhase}
          policySteps={policySteps}
          currentStep={currentStep}
          result={result}
          error={error}
          isFallback={isFallback}
          fallbackReason={fallbackReason}
          onReset={resetRun}
          onViewReceipt={(id) => navigate(`/receipt/${id}`)}
        />
      )}

      {/* Scenario Selection (show when idle or done) */}
      {(runPhase === "idle" || runPhase === "done") && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Play size={18} style={{ color: theme.colors.primary }} />
            {runPhase === "done" ? "Run Another Scenario" : "Choose a Scenario"}
          </h2>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            Select a scenario. The agent evaluates its policy rules step by step, then records the decision on-chain.
          </p>

          <div className="grid gap-4">
            {SCENARIOS.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <button
                  key={scenario.id}
                  onClick={() => runAgent(scenario)}
                  className={`${theme.ui.radius} border p-5 transition-all hover:border-opacity-80 text-left w-full group`}
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: scenario.color + "15" }}
                    >
                      <Icon size={24} style={{ color: scenario.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                        {scenario.label}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color: theme.colors.textMuted }}>
                        {scenario.description}
                      </p>
                      <p className="text-xs mt-2 font-mono" style={{ color: theme.colors.textMuted }}>
                        Agent: {scenario.agentId} &middot; Policy: {scenario.policyVersion}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all opacity-80 group-hover:opacity-100"
                      style={{ backgroundColor: scenario.color, color: "#fff" }}
                    >
                      <Play size={14} /> Run
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <hr style={{ borderColor: theme.colors.border }} />

      {/* Existing decisions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
          Recorded Decisions ({decisions.length})
        </h2>

        {decisions.map((d) => {
          const meta = SCENARIO_META[d.actionClass] || {
            label: d.actionClass,
            icon: Shield,
            color: theme.colors.primary,
          };
          const Icon = meta.icon;

          return (
            <div
              key={d.decisionId}
              className={`${theme.ui.radius} border p-5`}
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.color + "15" }}
                >
                  <Icon size={20} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm" style={{ color: theme.colors.text }}>
                      {meta.label}
                    </h3>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.colors.surfaceAlt,
                        color: theme.colors.textMuted,
                      }}
                    >
                      #{d.decisionId}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color: theme.colors.success }}>
                      <CheckCircle size={11} />
                      Block #{d.blockHeight}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                      <Hash size={10} />
                      {d.txHash.slice(0, 12)}...
                    </span>
                  </div>
                </div>
                <Link
                  to={`/receipt/${d.decisionId}`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                >
                  <FileText size={12} /> Receipt
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA to verify */}
      <div
        className={`${theme.ui.radius} border p-6 text-center`}
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
      >
        <Shield size={32} className="mx-auto mb-3" style={{ color: theme.colors.primary }} />
        <h3 className="font-semibold" style={{ color: theme.colors.text }}>
          Verify Any Decision
        </h3>
        <p className="text-sm mt-1 mb-4" style={{ color: theme.colors.textMuted }}>
          Pick a decision, edit the data, and see how on-chain hashes catch tampering.
        </p>
        <Link
          to="/verify"
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
        >
          <Shield size={16} /> Try Verification
        </Link>
      </div>
    </div>
  );
}

/* ---- Agent Run Panel ---- */

function AgentRunPanel({
  scenario,
  runPhase,
  policySteps,
  currentStep,
  result,
  error,
  isFallback,
  fallbackReason,
  onReset,
  onViewReceipt,
}: {
  scenario: typeof SCENARIOS[0];
  runPhase: RunPhase;
  policySteps: PolicyStep[];
  currentStep: number;
  result: DecisionRecord | null;
  error: string | null;
  isFallback: boolean;
  fallbackReason: string | null;
  onReset: () => void;
  onViewReceipt: (id: number) => void;
}) {
  const Icon = scenario.icon;
  const isFinished = runPhase === "done";

  return (
    <div
      className={`${theme.ui.radius} border overflow-hidden`}
      style={{
        borderColor: isFinished ? theme.colors.success + "40" : scenario.color + "40",
        backgroundColor: theme.colors.surface,
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b"
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: scenario.color + "20" }}
        >
          <Icon size={18} style={{ color: scenario.color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>
            {scenario.label}
          </p>
          <p className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
            {scenario.agentId} &middot; {scenario.policyVersion}
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            backgroundColor:
              runPhase === "done" ? theme.colors.success + "20" :
              runPhase === "decision" ? scenario.color + "20" :
              theme.colors.primary + "20",
            color:
              runPhase === "done" ? theme.colors.success :
              runPhase === "decision" ? scenario.color :
              theme.colors.primary,
          }}
        >
          {runPhase === "evaluating" ? "Evaluating policy..." :
           runPhase === "decision" ? "Decision reached" :
           runPhase === "recording" ? "Recording on-chain..." :
           "Complete"}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Input facts */}
        <div>
          <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: theme.colors.textMuted }}>
            <Eye size={12} /> Input Facts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(scenario.inputFacts).map(([key, value]) => (
              <div key={key} className="p-2 rounded" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: theme.colors.textMuted }}>
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono" style={{ color: theme.colors.text }}>
                  {typeof value === "number" && key.includes("amount") ? `$${value.toLocaleString()}` :
                   typeof value === "number" && key.includes("price") ? `$${value}` :
                   typeof value === "number" && key.includes("tolerance") ? `${(value * 100).toFixed(1)}%` :
                   typeof value === "number" && key.includes("volatility") ? `${(value * 100).toFixed(1)}%` :
                   typeof value === "number" && key.includes("threshold") ? `${(value * 100).toFixed(0)}%` :
                   typeof value === "number" && key.includes("budget") ? `$${value.toLocaleString()}` :
                   typeof value === "number" && key.includes("position") ? `$${value.toLocaleString()}` :
                   String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Policy evaluation steps */}
        <div>
          <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: theme.colors.textMuted }}>
            <Activity size={12} /> Policy Evaluation
          </h3>
          <div className="space-y-2">
            {policySteps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                  step.status === "running" ? "ring-1 ring-offset-1" : ""
                }`}
                style={{
                  backgroundColor: step.status === "pass" ? theme.colors.success + "08" :
                    step.status === "running" ? theme.colors.primary + "08" :
                    "transparent",
                  outlineColor: step.status === "running" ? theme.colors.primary : undefined,
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
                  {step.status === "fail" && (
                    <AlertTriangle size={16} style={{ color: theme.colors.error }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{
                    color: step.status === "pending" ? theme.colors.textMuted : theme.colors.text,
                  }}>
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
        {(runPhase === "decision" || runPhase === "recording" || runPhase === "done") && (
          <div className="animate-fade-in-up">
            <h3 className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: theme.colors.textMuted }}>
              <Brain size={12} /> Agent Decision
            </h3>
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: scenario.color + "40",
                backgroundColor: scenario.color + "08",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-sm font-bold font-mono px-3 py-1 rounded"
                  style={{ backgroundColor: scenario.color + "20", color: scenario.color }}
                >
                  {scenario.decision}
                </span>
                <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                  Risk: {(scenario.riskScore * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
                {scenario.reasoning}
              </p>
              <p className="text-[10px] mt-2 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                deterministic policy agent &middot; no LLM involved
              </p>
            </div>
          </div>
        )}

        {/* Recording phase */}
        {runPhase === "recording" && (
          <div className="flex items-center gap-3 p-3 rounded-lg animate-fade-in-up" style={{ backgroundColor: theme.colors.primary + "10" }}>
            <Loader2 size={16} className="animate-spin" style={{ color: theme.colors.primary }} />
            <span className="text-sm" style={{ color: theme.colors.primary }}>
              Hashing decision data and recording on Casper testnet...
            </span>
          </div>
        )}

        {/* Done — show on-chain proof */}
        {runPhase === "done" && result && (
          <div className="animate-fade-in-up space-y-3">
            {isFallback ? (
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{ backgroundColor: "#f59e0b20", borderLeft: "3px solid #f59e0b" }}
              >
                <AlertTriangle size={20} style={{ color: "#f59e0b" }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                    Read-Only Demo — Seeded Receipt
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                    {fallbackReason || "Live recording unavailable"} &middot; Showing pre-recorded on-chain data
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{ backgroundColor: theme.colors.success + "10", borderLeft: `3px solid ${theme.colors.success}` }}
              >
                <CheckCircle size={20} style={{ color: theme.colors.success }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: theme.colors.success }}>
                    Decision Recorded On-Chain
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                    Block #{result.blockHeight} &middot; Casper testnet
                  </p>
                </div>
              </div>
            )}

            <div className="font-mono text-xs space-y-1.5 p-3 rounded-lg" style={{ backgroundColor: theme.colors.surfaceAlt, color: theme.colors.textMuted }}>
              <div className="flex items-center gap-2">
                <Hash size={11} /> TX: {result.txHash}
              </div>
              <div className="flex items-center gap-2">
                <Shield size={11} /> Input: {result.inputHash}
              </div>
              <div className="flex items-center gap-2">
                <Shield size={11} /> Output: {result.outputHash}
              </div>
              {result.jobPaymentRefHash && (
                <div className="flex items-center gap-2">
                  <Zap size={11} /> Job Ref: {result.jobPaymentRefHash}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewReceipt(result.decisionId)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: theme.colors.primary, color: "#fff" }}
              >
                <FileText size={14} /> View Receipt
              </button>
              <a
                href={`https://testnet.cspr.live/transaction/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
              >
                <ExternalLink size={14} /> Casper Explorer
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className={`${theme.ui.radius} border p-4 flex items-center gap-3`}
            style={{ borderColor: "#f8717140", backgroundColor: "#f8717108" }}
          >
            <AlertTriangle size={18} style={{ color: "#f87171" }} />
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          </div>
        )}

        {/* Flow summary arrow */}
        {runPhase === "done" && (
          <div className="flex items-center gap-2 text-xs pt-2" style={{ color: theme.colors.textMuted }}>
            <span>Input facts</span>
            <ArrowRight size={12} />
            <span>Policy rules</span>
            <ArrowRight size={12} />
            <span>Decision</span>
            <ArrowRight size={12} />
            <span className="font-medium" style={{ color: theme.colors.success }}>On-chain receipt</span>
          </div>
        )}
      </div>
    </div>
  );
}
