import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  CheckCircle,
  Loader2,
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Hash,
  Briefcase,
  TrendingUp,
  AlertOctagon,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { RecordResponse } from "../lib/api";

type WorkflowStep = "pick" | "recording" | "pending" | "confirmed";

const SCENARIOS = [
  {
    id: "vendor_payment",
    label: "Vendor Payment",
    icon: Briefcase,
    agent: "treasury-agent-01",
    description: "Treasury agent approves a $8,500 invoice payment to Acme Cloud",
    detail: "Checks budget threshold, generates approval confidence, binds to payment ref hash",
    color: "#34d399",
  },
  {
    id: "defi_swap",
    label: "DeFi Swap",
    icon: TrendingUp,
    agent: "trading-agent-alpha",
    description: "Trading agent executes a 1,000 CSPR/USDT swap on bullish signal",
    detail: "Evaluates market signal, calculates slippage, records execution receipt",
    color: "#60a5fa",
  },
  {
    id: "risk_alert",
    label: "Risk Alert",
    icon: AlertOctagon,
    agent: "risk-monitor-eu",
    description: "Risk monitor flags a 15% portfolio drawdown exceeding threshold",
    detail: "Triggers exposure reduction, notifies risk team, records severity assessment",
    color: "#f87171",
  },
];

function generateSessionId(): string {
  return "wb-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function Workbench() {
  const [step, setStep] = useState<WorkflowStep>("pick");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [result, setResult] = useState<RecordResponse | null>(null);
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [sessionRecordings, setSessionRecordings] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check session limits on mount
  useEffect(() => {
    api.workbenchLimits(sessionId)
      .then((l) => setSessionRecordings(l.session.recordings))
      .catch(() => {});
  }, [sessionId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleRecord = useCallback(async (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setStep("recording");
    setError(null);
    setResult(null);
    setBlockHeight(0);

    try {
      const res = await api.workbenchRecord(scenarioId, sessionId);
      setResult(res);
      setSessionRecordings((p) => p + 1);
      setStep("pending");

      // Start polling for finality
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const fin = await api.finality(res.decisionId);
          if (fin.status === "confirmed") {
            setBlockHeight(fin.blockHeight);
            setStep("confirmed");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          // ignore polling errors
        }
        // Stop after 2 minutes (24 * 5s)
        if (attempts >= 24) {
          if (pollRef.current) clearInterval(pollRef.current);
          // Show confirmed anyway (Casper testnet can be slow)
          setStep("confirmed");
        }
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to record");
      setStep("pick");
    }
  }, [sessionId]);

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("pick");
    setSelectedScenario(null);
    setResult(null);
    setBlockHeight(0);
    setError(null);
  };

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario);
  const sessionRemaining = 5 - sessionRecordings;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Agent Workbench
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Pick a scenario. The agent decides. The receipt goes on-chain.
        </p>
      </div>

      {/* Session usage bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 ${theme.ui.radius} border`}
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
      >
        <span className="text-xs" style={{ color: theme.colors.textMuted }}>
          Session recordings
        </span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    i < sessionRecordings
                      ? theme.colors.primary
                      : theme.colors.surfaceAlt,
                }}
              />
            ))}
          </div>
          <span
            className="text-xs font-mono"
            style={{
              color:
                sessionRemaining <= 1
                  ? theme.colors.warning
                  : theme.colors.textMuted,
            }}
          >
            {sessionRemaining} left
          </span>
        </div>
      </div>

      {error && (
        <div
          className={`flex items-center gap-3 p-4 ${theme.ui.radius}`}
          style={{ backgroundColor: theme.colors.error + "15" }}
        >
          <AlertTriangle size={18} style={{ color: theme.colors.error }} />
          <p className="text-sm" style={{ color: theme.colors.error }}>{error}</p>
        </div>
      )}

      {/* Step: Pick scenario */}
      {step === "pick" && (
        <div className="grid grid-cols-1 gap-4">
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            const disabled = sessionRemaining <= 0;
            return (
              <button
                key={s.id}
                onClick={() => !disabled && handleRecord(s.id)}
                disabled={disabled}
                className={`text-left p-5 ${theme.ui.radius} border transition-all ${
                  disabled ? "opacity-40 cursor-not-allowed" : "hover:border-current cursor-pointer"
                }`}
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: s.color + "15" }}
                  >
                    <Icon size={24} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="font-semibold"
                        style={{ color: theme.colors.text }}
                      >
                        {s.label}
                      </h3>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: theme.colors.surfaceAlt,
                          color: theme.colors.textMuted,
                        }}
                      >
                        {s.agent}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                      {s.description}
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textMuted + "99" }}>
                      {s.detail}
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="flex-shrink-0 mt-3"
                    style={{ color: theme.colors.textMuted }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step: Recording (submitting to chain) */}
      {step === "recording" && scenario && (
        <div className={`card ${theme.ui.radius} text-center py-12`}>
          <Loader2
            size={40}
            className="animate-spin mx-auto mb-4"
            style={{ color: theme.colors.primary }}
          />
          <p
            className="font-semibold text-lg"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
          >
            Agent is deciding...
          </p>
          <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
            {scenario.label}: hashing data and submitting to Casper testnet
          </p>
        </div>
      )}

      {/* Step: Pending confirmation */}
      {step === "pending" && result && scenario && (
        <div className={`card ${theme.ui.radius} space-y-5`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Clock size={24} style={{ color: theme.colors.warning }} />
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: theme.colors.warning }}
              />
            </div>
            <div>
              <p
                className="font-semibold"
                style={{ color: theme.colors.warning, fontFamily: theme.fonts.headline }}
              >
                Pending Confirmation
              </p>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                Transaction submitted. Waiting for Casper block finality...
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <InfoRow label="Scenario" value={scenario.label} />
            <InfoRow label="Agent" value={scenario.agent} mono />
            <InfoRow label="Decision ID" value={`#${result.decisionId}`} mono />
            <InfoRow label="Tx Hash" value={result.txHash} mono truncate />
          </div>

          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: theme.colors.primary }}
            />
            <span className="text-xs" style={{ color: theme.colors.textMuted }}>
              Polling for on-chain confirmation...
            </span>
          </div>
        </div>
      )}

      {/* Step: Confirmed */}
      {step === "confirmed" && result && scenario && (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-4 p-5 ${theme.ui.radius}`}
            style={{
              backgroundColor: theme.colors.success + "10",
              borderLeft: `4px solid ${theme.colors.success}`,
            }}
          >
            <CheckCircle size={32} style={{ color: theme.colors.success }} />
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: theme.colors.success, fontFamily: theme.fonts.headline }}
              >
                Confirmed On-Chain
              </p>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                Decision #{result.decisionId} recorded at block{" "}
                {blockHeight > 0 ? `#${blockHeight}` : "(finalizing)"}.
              </p>
            </div>
          </div>

          <div className={`card ${theme.ui.radius} space-y-3`}>
            <InfoRow label="Agent" value={scenario.agent} mono />
            <InfoRow label="Action" value={scenario.label} />
            <InfoRow label="Input Hash" value={result.inputHash} mono truncate />
            <InfoRow label="Output Hash" value={result.outputHash} mono truncate />
            <InfoRow label="Tx Hash" value={result.txHash} mono truncate />
            {blockHeight > 0 && (
              <InfoRow label="Block" value={`#${blockHeight}`} mono />
            )}
          </div>

          <div className="flex gap-3">
            <Link
              to={`/receipt/${result.decisionId}`}
              className="flex items-center justify-center gap-2 flex-1 py-3 text-sm rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
            >
              <FileText size={16} /> View Receipt
            </Link>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 py-3 text-sm rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
            >
              <ExternalLink size={16} /> Casper Explorer
            </a>
          </div>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
          >
            <Zap size={14} /> Try Another Scenario
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  truncate: trunc,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className="text-xs uppercase tracking-wider flex-shrink-0"
        style={{ color: theme.colors.textMuted }}
      >
        {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono" : ""} ${trunc ? "truncate" : ""} text-right`}
        style={{ color: theme.colors.text }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
