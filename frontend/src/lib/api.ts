/**
 * AgentLedger API — fully static (no backend required).
 * Decisions loaded from /decisions.json (bundled at build time).
 * Verification runs client-side via Casper RPC proxy (/api/rpc).
 */
import type { DecisionRecord, AgentSummary } from "./types";
import { verifyDecision, generateAuditReport, auditReportToMarkdown, type VerifyResult } from "./casper-verify";

// Re-export VerifyResult as VerifyResponse for backwards compat
export type VerifyResponse = VerifyResult;

let _decisionsCache: DecisionRecord[] | null = null;

async function loadDecisions(): Promise<DecisionRecord[]> {
  if (_decisionsCache) return _decisionsCache;
  const res = await fetch("/decisions.json");
  if (!res.ok) throw new Error("Failed to load decisions data");
  _decisionsCache = await res.json();
  return _decisionsCache!;
}

export interface DecisionsResponse {
  decisions: DecisionRecord[];
  total: number;
}

export interface StatsResponse {
  totalDecisions: number;
  totalAgents: number;
  latestBlock: number;
  confirmedOnChain: number;
  agents: AgentSummary[];
}

export interface RecordResponse {
  success: boolean;
  decisionId: number;
  inputHash: string;
  outputHash: string;
  txHash: string;
  explorerUrl: string;
  fallback?: boolean;
  fallbackReason?: string;
  // Full decision record returned by the backend on live recording.
  // Use this directly instead of calling getDecision() to avoid a second
  // round-trip against the static /decisions.json (which only has seed data).
  decision?: DecisionRecord;
}

export interface WorkbenchLimitsResponse {
  rateLimit: { max: number; remaining: number; windowMs: number };
  session: { recordings: number; cap: number };
}

export interface FinalityResponse {
  status: "confirmed" | "pending";
  blockHeight: number;
  decisionId: number;
}

export const api = {
  getDecisions: async (agent?: string): Promise<DecisionsResponse> => {
    const all = await loadDecisions();
    let result = [...all].reverse(); // newest first
    if (agent && agent !== "all") {
      result = result.filter((d) => d.agentId === agent);
    }
    return { decisions: result, total: result.length };
  },

  getDecision: async (id: number): Promise<DecisionRecord> => {
    // Try static bundled decisions first (seeded data).
    const all = await loadDecisions();
    const decision = all.find((d) => d.decisionId === id);
    if (decision) return decision;
    // Not in static file — this is a live-recorded decision.
    // Fetch from the backend via the /api/backend proxy (which reads decisions-store.json).
    return api.getLiveDecision(id);
  },

  // Fetch a single decision from the live backend store (bypasses static /decisions.json).
  // Used for decisions recorded in the current demo session that aren't in the build bundle.
  getLiveDecision: async (id: number): Promise<DecisionRecord> => {
    // Try Vercel edge proxy path first, then direct backend path (for dev proxy)
    let res = await fetch(`/api/backend/decisions/${id}`);
    if (!res.ok) {
      res = await fetch(`/api/decisions/${id}`);
    }
    if (!res.ok) throw new Error(`Decision ${id} not found in live store`);
    return res.json();
  },

  getStats: async (): Promise<StatsResponse> => {
    const all = await loadDecisions();
    const agentSet = new Set(all.map((d) => d.agentId));
    const latestBlock = Math.max(...all.map((d) => d.blockHeight || 0));
    const confirmedOnChain = all.filter((d) => d.blockHeight > 0).length;
    return {
      totalDecisions: all.length,
      totalAgents: agentSet.size,
      latestBlock,
      confirmedOnChain,
      agents: [...agentSet].map((agentId) => {
        const agentDecs = all.filter((d) => d.agentId === agentId);
        const latest = agentDecs[agentDecs.length - 1];
        return {
          agentId,
          totalDecisions: agentDecs.length,
          lastAction: latest?.actionClass || "none",
          lastTimestamp: latest?.timestamp || "",
        };
      }),
    };
  },

  verify: async (decisionId: number, inputData: any, outputData: any): Promise<VerifyResponse> => {
    const all = await loadDecisions();
    let decision = all.find((d) => d.decisionId === decisionId);
    if (!decision) {
      // Not in static bundle — try the live backend (freshly recorded decisions)
      decision = await api.getLiveDecision(decisionId);
    }
    return verifyDecision(decision, inputData, outputData);
  },

  // Record a decision on-chain via Vercel proxy
  record: async (scenario: string): Promise<RecordResponse> => {
    const res = await fetch("/api/workbench/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.detail || data.error);
    return data;
  },

  health: async () => {
    const all = await loadDecisions();
    return { status: "ok", decisions: all.length };
  },

  // Record via workbench (live on-chain)
  workbenchRecord: async (scenario: string): Promise<RecordResponse> => {
    const res = await fetch("/api/workbench/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.detail || data.error);
    return data;
  },

  workbenchLimits: async (): Promise<WorkbenchLimitsResponse> => {
    try {
      const res = await fetch("/api/backend/workbench/limits");
      if (res.ok) return res.json();
    } catch { /* fall through to defaults */ }
    return {
      rateLimit: { max: 3, remaining: 3, windowMs: 60000 },
      session: { recordings: 0, cap: 5 },
    };
  },

  finality: async (id: number): Promise<FinalityResponse> => {
    const all = await loadDecisions();
    const decision = all.find((d) => d.decisionId === id);
    if (!decision) throw new Error("Decision not found");
    return {
      status: decision.blockHeight > 0 ? "confirmed" : "pending",
      blockHeight: decision.blockHeight,
      decisionId: id,
    };
  },

  auditReport: async (id: number, format: "markdown" | "json" = "markdown") => {
    const all = await loadDecisions();
    const decision = all.find((d) => d.decisionId === id);
    if (!decision) throw new Error("Decision not found");

    // Run verification first
    const verification = await verifyDecision(decision, decision.inputData || {}, decision.outputData || {});
    const report = generateAuditReport(decision, verification);

    let content: string;
    let mimeType: string;
    let ext: string;

    if (format === "json") {
      content = JSON.stringify(report, null, 2);
      mimeType = "application/json";
      ext = "json";
    } else {
      content = auditReportToMarkdown(report);
      mimeType = "text/markdown";
      ext = "md";
    }

    // Trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentledger-receipt-${id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
