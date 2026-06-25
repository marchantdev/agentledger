import { useState, useCallback } from "react";
import { Send, CheckCircle, Hash, ExternalLink, Loader2, Shield, Copy, Check, AlertTriangle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { theme, densityMap } from "../theme.config";
import { api } from "../lib/api";
import type { RecordResponse } from "../lib/api";

const PRESETS = [
  {
    label: "Vendor Payment",
    agentId: "treasury-agent-01",
    actionClass: "vendor_payment_approval",
    inputData: JSON.stringify({ invoice_id: "INV-2026-1547", vendor: "Northwind Cloud", amount: 8500, currency: "USDT", budget_remaining: 52000 }, null, 2),
    outputData: JSON.stringify({ decision: "APPROVED", reason: "Within budget threshold (16%)", payment_amount: 8500, approval_confidence: 0.96 }, null, 2),
    jobPaymentRefHash: "x402-job-0x8a1b2c3d",
  },
  {
    label: "DeFi Swap",
    agentId: "trading-agent-alpha",
    actionClass: "swap",
    inputData: JSON.stringify({ pair: "CSPR/USDT", amount: 1000, slippage: 0.5, market_signal: "bullish_breakout" }, null, 2),
    outputData: JSON.stringify({ executed: true, price: 0.042, received: 997.5, fee: 2.5, confidence: 0.91 }, null, 2),
    jobPaymentRefHash: "x402-swap-0xb2c3d4e5",
  },
  {
    label: "Risk Alert",
    agentId: "risk-monitor-eu",
    actionClass: "risk_alert",
    inputData: JSON.stringify({ portfolio: "fund-beta", threshold: 0.12, current_drawdown: 0.15, var_95: 95000 }, null, 2),
    outputData: JSON.stringify({ alert: "DRAWDOWN_EXCEEDED", severity: "MEDIUM", action: "reduce_exposure_15pct", notified: ["risk-team@fund.io"] }, null, 2),
    jobPaymentRefHash: "x402-monitor-0xc3d4e5f6",
  },
];

export default function RecordDemo() {
  const density = densityMap[theme.ui.density];

  const [agentId, setAgentId] = useState(PRESETS[0].agentId);
  const [actionClass, setActionClass] = useState(PRESETS[0].actionClass);
  const [inputData, setInputData] = useState(PRESETS[0].inputData);
  const [outputData, setOutputData] = useState(PRESETS[0].outputData);
  const [jobRef, setJobRef] = useState(PRESETS[0].jobPaymentRefHash);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setAgentId(p.agentId);
    setActionClass(p.actionClass);
    setInputData(p.inputData);
    setOutputData(p.outputData);
    setJobRef(p.jobPaymentRefHash);
    setResult(null);
    setError(null);
  };

  const handleAttest = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const parsedInput = JSON.parse(inputData);
      const parsedOutput = JSON.parse(outputData);

      const res = await api.record("vendor_payment");

      setResult(res);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON in input or output data");
      } else {
        setError(err.message || "Failed to record decision");
      }
    } finally {
      setLoading(false);
    }
  }, [agentId, actionClass, inputData, outputData, jobRef]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}>
          Record Decision
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Attest an AI agent decision on Casper testnet. Input and output are SHA-256 hashed and recorded on-chain.
        </p>
        <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, color: theme.colors.textMuted }}>
          <strong>Note:</strong> This public demo shows read-only verified receipts and seeded walkthroughs. The demo video shows a fresh live recording against the Casper testnet backend. To try live recording, run the backend locally — see the README.
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => applyPreset(i)}
            className="px-3 py-1.5 text-xs rounded-full border transition-colors"
            style={{
              borderColor: agentId === p.agentId ? theme.colors.primary : theme.colors.border,
              color: agentId === p.agentId ? theme.colors.primary : theme.colors.textMuted,
              backgroundColor: agentId === p.agentId ? theme.colors.primary + "15" : "transparent",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className={`card ${theme.ui.radius} space-y-4`}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Shield size={16} style={{ color: theme.colors.accent }} /> Decision Parameters
          </h2>

          <div>
            <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: theme.colors.textMuted }}>Agent ID</label>
            <input type="text" value={agentId} onChange={(e) => setAgentId(e.target.value)}
              className={`w-full px-3 py-2 ${theme.ui.radius} border text-sm font-mono bg-transparent`}
              style={{ borderColor: theme.colors.border, color: theme.colors.text }} />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: theme.colors.textMuted }}>Action Class</label>
            <input type="text" value={actionClass} onChange={(e) => setActionClass(e.target.value)}
              className={`w-full px-3 py-2 ${theme.ui.radius} border text-sm font-mono bg-transparent`}
              style={{ borderColor: theme.colors.border, color: theme.colors.text }} />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: theme.colors.textMuted }}>Job/Payment Reference</label>
            <input type="text" value={jobRef} onChange={(e) => setJobRef(e.target.value)}
              className={`w-full px-3 py-2 ${theme.ui.radius} border text-sm font-mono bg-transparent`}
              style={{ borderColor: theme.colors.border, color: theme.colors.text }} />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: theme.colors.textMuted }}>Input Data (JSON)</label>
            <textarea value={inputData} onChange={(e) => setInputData(e.target.value)} rows={5}
              className={`w-full px-3 py-2 ${theme.ui.radius} border text-xs font-mono bg-transparent resize-none`}
              style={{ borderColor: theme.colors.border, color: theme.colors.text }} spellCheck={false} />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider mb-1 block" style={{ color: theme.colors.textMuted }}>Output Data (JSON)</label>
            <textarea value={outputData} onChange={(e) => setOutputData(e.target.value)} rows={5}
              className={`w-full px-3 py-2 ${theme.ui.radius} border text-xs font-mono bg-transparent resize-none`}
              style={{ borderColor: theme.colors.border, color: theme.colors.text }} spellCheck={false} />
          </div>

          <button onClick={handleAttest} disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting to Casper...</>
            ) : (
              <><Send size={16} /> Record Decision On-Chain</>
            )}
          </button>
        </div>

        {/* Result panel */}
        <div className={`card ${theme.ui.radius}`}>
          <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: theme.colors.text }}>
            <Hash size={16} style={{ color: theme.colors.accent }} /> Attestation Receipt
          </h2>

          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: theme.colors.textMuted }}>
              <Shield size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Submit a decision to record it on Casper testnet.</p>
              <p className="text-xs mt-2">Input and output data are SHA-256 hashed before on-chain submission.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin mb-4" style={{ color: theme.colors.primary }} />
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                Hashing data and submitting to Casper testnet...
              </p>
            </div>
          )}

          {error && (
            <div className={`flex items-center gap-3 p-4 ${theme.ui.radius} mb-4`} style={{ backgroundColor: theme.colors.error + "15" }}>
              <AlertTriangle size={20} style={{ color: theme.colors.error }} />
              <p className="text-sm" style={{ color: theme.colors.error }}>{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in-up">
              <div className={`flex items-center gap-3 p-3 ${theme.ui.radius}`} style={{ backgroundColor: theme.colors.success + "10" }}>
                <CheckCircle size={20} style={{ color: theme.colors.success }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.success }}>Decision Recorded On-Chain</p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Decision #{result.decisionId} submitted to Casper testnet
                  </p>
                </div>
              </div>

              {[
                { label: "Decision ID", value: `#${result.decisionId}` },
                { label: "Agent", value: agentId },
                { label: "Action", value: actionClass },
                { label: "Input Hash", value: result.inputHash, copyable: true },
                { label: "Output Hash", value: result.outputHash, copyable: true },
                { label: "Transaction Hash", value: result.txHash, copyable: true },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: theme.colors.textMuted }}>{field.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono truncate flex-1" style={{ color: theme.colors.text }} title={field.value}>
                      {field.value}
                    </p>
                    {field.copyable && (
                      <button
                        onClick={() => copyToClipboard(field.value, field.label)}
                        className="flex-shrink-0 p-1 rounded transition-colors"
                        style={{ color: copied === field.label ? theme.colors.success : theme.colors.textMuted }}
                      >
                        {copied === field.label ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-2">
                <Link
                  to={`/receipt/${result.decisionId}`}
                  className="flex items-center justify-center gap-2 flex-1 py-2 text-sm rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                >
                  <FileText size={14} /> View Receipt
                </Link>
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 flex-1 py-2 text-sm rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                >
                  <ExternalLink size={14} /> Casper Explorer
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
