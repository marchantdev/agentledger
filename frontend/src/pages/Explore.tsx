import { useState, useEffect, useMemo } from "react";
import { Search, Shield, Hash, ExternalLink, Loader2 } from "lucide-react";
import { theme, densityMap } from "../theme.config";
import { api } from "../lib/api";
import type { DecisionRecord, AgentSummary } from "../lib/types";

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return hash.slice(0, 8) + "..." + hash.slice(-8);
}

export default function Explore() {
  const [query, setQuery] = useState("");
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const density = densityMap[theme.ui.density];

  useEffect(() => {
    Promise.all([api.getDecisions(), api.getStats()])
      .then(([decRes, statsRes]) => {
        setDecisions(decRes.decisions);
        setAgents(statsRes.agents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredDecisions = useMemo(() => {
    if (!query) return decisions;
    const q = query.toLowerCase();
    return decisions.filter(
      (d) =>
        d.agentId.toLowerCase().includes(q) ||
        d.actionClass.toLowerCase().includes(q) ||
        d.inputHash.includes(query) ||
        d.outputHash.includes(query) ||
        String(d.decisionId).includes(query)
    );
  }, [query, decisions]);

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
          Explorer
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          Search and verify agent decisions recorded on-chain.
        </p>
      </div>

      {/* Search */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${theme.ui.radius} border`}
        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
      >
        <Search size={16} style={{ color: theme.colors.textMuted }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by agent ID, action class, or hash..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: theme.colors.text }}
        />
        <span className="text-xs font-mono" style={{ color: theme.colors.textMuted }}>
          {filteredDecisions.length} results
        </span>
      </div>

      {/* Agent summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.agentId}
            onClick={() => setQuery(agent.agentId)}
            className={`${theme.ui.radius} p-3 border text-left transition-all hover:border-current`}
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
          >
            <p className="text-xs font-mono font-medium truncate" style={{ color: theme.colors.text }}>
              {agent.agentId}
            </p>
            <p className="text-lg font-bold mt-1" style={{ color: theme.colors.primary }}>
              {agent.totalDecisions}
            </p>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>decisions</p>
          </button>
        ))}
      </div>

      {/* Results table */}
      <div className={`card ${theme.ui.radius} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: theme.colors.border }}>
                {["ID", "Agent", "Action", "Input Hash", "Output Hash", "Block", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-medium uppercase tracking-wider"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDecisions.slice(0, 20).map((d) => (
                <tr key={d.decisionId} className="border-b transition-colors" style={{ borderColor: theme.colors.border + "60" }}>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: theme.colors.textMuted }}>#{d.decisionId}</td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: theme.colors.text }}>{d.agentId}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: theme.colors.primary + "15", color: theme.colors.primary }}>
                      {d.actionClass}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-mono flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
                      <Hash size={10} />{truncateHash(d.inputHash)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-mono flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
                      <Hash size={10} />{truncateHash(d.outputHash)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: theme.colors.textMuted }}>{d.blockHeight}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`https://testnet.cspr.live/transaction/${d.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80"
                      style={{ color: theme.colors.primary }}
                    >
                      <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDecisions.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: theme.colors.textMuted }}>
            No decisions match your search.
          </p>
        )}
      </div>
    </div>
  );
}
