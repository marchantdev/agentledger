import { useState, useEffect, useMemo } from "react";
import { Clock, ExternalLink, Hash, Shield, Filter, Loader2 } from "lucide-react";
import StatCards from "../components/StatCards";
import { theme, densityMap } from "../theme.config";
import { api } from "../lib/api";
import type { DecisionRecord, AgentSummary, Stats } from "../lib/types";

const ACTION_COLORS: Record<string, string> = {
  swap: "#2dd4bf",
  rebalance: "#60a5fa",
  risk_alert: "#f87171",
  "risk-alert": "#f87171",
  yield_harvest: "#a78bfa",
  "yield-harvest": "#a78bfa",
  vendor_payment_approval: "#34d399",
  payment_rejection: "#fb923c",
  "position-close": "#fb923c",
  "limit-order": "#34d399",
  hedge: "#fbbf24",
};

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return hash.slice(0, 8) + "..." + hash.slice(-8);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [confirmedOnChain, setConfirmedOnChain] = useState(0);
  const [latestBlock, setLatestBlock] = useState(0);
  const [loading, setLoading] = useState(true);
  const density = densityMap[theme.ui.density];

  useEffect(() => {
    Promise.all([api.getDecisions(), api.getStats()])
      .then(([decRes, statsRes]) => {
        setDecisions(decRes.decisions);
        setTotalDecisions(statsRes.totalDecisions);
        setConfirmedOnChain(statsRes.confirmedOnChain);
        setLatestBlock(statsRes.latestBlock);
        setAgents(statsRes.agents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredDecisions = useMemo(() => {
    if (selectedAgent === "all") return decisions;
    return decisions.filter((d) => d.agentId === selectedAgent);
  }, [selectedAgent, decisions]);

  const stats: Stats[] = [
    { label: "On-Chain Receipts", value: totalDecisions },
    { label: "Confirmed", value: confirmedOnChain },
    { label: "Active Agents", value: agents.length },
    { label: "Latest Block", value: latestBlock, prefix: "#" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: theme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}>
          Decision Registry
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Real-time feed of agent decisions recorded on Casper testnet.
        </p>
      </div>

      {theme.features.showStats && <StatCards stats={stats} loading={false} />}

      {/* Agent filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} style={{ color: theme.colors.textMuted }} />
        <button
          onClick={() => setSelectedAgent("all")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedAgent === "all" ? "border-current" : ""}`}
          style={{
            color: selectedAgent === "all" ? theme.colors.primary : theme.colors.textMuted,
            borderColor: selectedAgent === "all" ? theme.colors.primary : theme.colors.border,
            backgroundColor: selectedAgent === "all" ? theme.colors.primary + "15" : "transparent",
          }}
        >
          All Agents
        </button>
        {agents.map((agent) => (
          <button
            key={agent.agentId}
            onClick={() => setSelectedAgent(agent.agentId)}
            className="px-3 py-1 text-xs rounded-full border transition-colors"
            style={{
              color: selectedAgent === agent.agentId ? theme.colors.primary : theme.colors.textMuted,
              borderColor: selectedAgent === agent.agentId ? theme.colors.primary : theme.colors.border,
              backgroundColor: selectedAgent === agent.agentId ? theme.colors.primary + "15" : "transparent",
            }}
          >
            {agent.agentId}
          </button>
        ))}
      </div>

      {/* Decision timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 card ${theme.ui.radius}`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: theme.colors.accent }} />
            <h2 className="font-semibold" style={{ color: theme.colors.text }}>Decision Timeline</h2>
            <span className="text-xs ml-auto font-mono" style={{ color: theme.colors.textMuted }}>
              {filteredDecisions.length} records
            </span>
          </div>
          <div className="divide-y overflow-auto max-h-[600px]" style={{ borderColor: theme.colors.border }}>
            {filteredDecisions.map((d, i) => (
              <DecisionRow key={d.decisionId} decision={d} index={i} />
            ))}
          </div>
        </div>

        {/* Agent summary sidebar */}
        <div className={`card ${theme.ui.radius}`}>
          <h2 className="font-semibold mb-4" style={{ color: theme.colors.text }}>Registered Agents</h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <button
                key={agent.agentId}
                onClick={() => setSelectedAgent(agent.agentId)}
                className="w-full text-left p-3 rounded-lg border transition-all hover:border-current"
                style={{
                  borderColor: selectedAgent === agent.agentId ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selectedAgent === agent.agentId ? theme.colors.primary + "08" : theme.colors.surfaceAlt,
                }}
              >
                <p className="text-sm font-medium font-mono" style={{ color: theme.colors.text }}>{agent.agentId}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: theme.colors.textMuted }}>{agent.totalDecisions} decisions</span>
                  <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {agent.lastTimestamp ? timeAgo(agent.lastTimestamp) : "—"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>Network</span>
              <span className="text-sm font-mono" style={{ color: theme.colors.text }}>Casper Testnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>Status</span>
              <span className="badge-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionRow({ decision: d, index }: { decision: DecisionRecord; index: number }) {
  const actionColor = ACTION_COLORS[d.actionClass] || theme.colors.textMuted;

  return (
    <div className="flex items-start gap-3 py-3 animate-fade-in-up" style={{ animationDelay: `${index * 0.03}s` }}>
      <div className="flex flex-col items-center mt-1">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: actionColor }} />
        <div className="w-px flex-1 mt-1" style={{ backgroundColor: theme.colors.border }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: actionColor + "20", color: actionColor }}>
            {d.actionClass}
          </span>
          <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>#{d.decisionId}</span>
        </div>
        <p className="text-xs font-mono mt-1" style={{ color: theme.colors.textMuted }}>{d.agentId}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="flex items-center gap-1 text-xs" style={{ color: theme.colors.textMuted }}>
            <Hash size={10} />{truncateHash(d.inputHash)}
          </span>
          <span className="text-xs" style={{ color: theme.colors.border }}>→</span>
          <span className="flex items-center gap-1 text-xs" style={{ color: theme.colors.textMuted }}>
            <Hash size={10} />{truncateHash(d.outputHash)}
          </span>
        </div>
        {d.jobPaymentRefHash && (
          <p className="text-xs mt-1" style={{ color: theme.colors.accent }}>
            Job ref: {truncateHash(d.jobPaymentRefHash)}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs whitespace-nowrap flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
          <Clock size={10} /> {timeAgo(d.timestamp)}
        </span>
        <a
          href={`https://testnet.cspr.live/transaction/${d.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80"
          style={{ color: theme.colors.primary }}
        >
          <ExternalLink size={10} /> Explorer
        </a>
      </div>
    </div>
  );
}
