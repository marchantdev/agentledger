import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Lock,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { DecisionRecord } from "../lib/types";

const SCENARIO_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  vendor_payment_approval: {
    label: "Vendor Payment",
    icon: Briefcase,
    color: "#34d399",
    description: "Treasury agent approves a payment based on budget threshold analysis",
  },
  payment_rejection: {
    label: "Payment Rejection",
    icon: AlertTriangle,
    color: "#fb923c",
    description: "Treasury agent rejects a payment exceeding single-vendor budget limit",
  },
  risk_alert: {
    label: "Risk Alert",
    icon: AlertOctagon,
    color: "#f87171",
    description: "Risk monitor flags portfolio drawdown exceeding volatility threshold",
  },
  swap: {
    label: "DeFi Swap",
    icon: TrendingUp,
    color: "#60a5fa",
    description: "Trading agent executes a token swap based on market signal analysis",
  },
  rebalance: {
    label: "Portfolio Rebalance",
    icon: Zap,
    color: "#a78bfa",
    description: "Trading agent rebalances portfolio allocation to match target weights",
  },
};

export default function Workbench() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDecisions()
      .then((res) => setDecisions(res.decisions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Agent Workbench
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Browse {decisions.length} agent decisions recorded on Casper testnet.
          Each receipt is independently verifiable via RPC.
        </p>
      </div>

      {/* Static mode notice */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${theme.ui.radius} border`}
        style={{
          borderColor: theme.colors.primary + "30",
          backgroundColor: theme.colors.primary + "08",
        }}
      >
        <Lock size={16} style={{ color: theme.colors.primary }} />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
            Read-Only Demo
          </p>
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            These {decisions.length} decisions were recorded on-chain during the live demo.
            Live recording requires a backend with the signing key.
          </p>
        </div>
      </div>

      {/* Recorded decisions */}
      <div className="space-y-4">
        {decisions.map((d) => {
          const meta = SCENARIO_META[d.actionClass] || {
            label: d.actionClass,
            icon: Shield,
            color: theme.colors.primary,
            description: "",
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
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.color + "15" }}
                >
                  <Icon size={24} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold" style={{ color: theme.colors.text }}>
                      {meta.label}
                    </h3>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.colors.surfaceAlt,
                        color: theme.colors.textMuted,
                      }}
                    >
                      {d.agentId}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: theme.colors.surfaceAlt,
                        color: theme.colors.textMuted,
                      }}
                    >
                      #{d.decisionId}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                    {meta.description}
                  </p>

                  {/* On-chain proof summary */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color: theme.colors.success }}>
                      <CheckCircle size={12} />
                      Block #{d.blockHeight}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-mono" style={{ color: theme.colors.textMuted }}>
                      <Hash size={10} />
                      {d.txHash.slice(0, 12)}...
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    to={`/receipt/${d.decisionId}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
                  >
                    <FileText size={12} /> Receipt
                  </Link>
                  <a
                    href={`https://testnet.cspr.live/transaction/${d.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                  >
                    <ExternalLink size={12} /> Explorer
                  </a>
                </div>
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
