import type { DecisionRecord, AgentSummary } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

export interface DecisionsResponse {
  decisions: DecisionRecord[];
  total: number;
}

export interface StatsResponse {
  totalDecisions: number;
  totalAgents: number;
  latestBlock: number;
  agents: AgentSummary[];
}

export interface VerifyResponse {
  verified: boolean;
  chainVerified: boolean;
  chainStatus: "finalized" | "not_found" | "pending" | "rpc_error" | "parse_failed" | "unknown";
  decisionId: number;
  onChain: {
    inputHash: string | null;
    outputHash: string | null;
    txHash: string;
    blockHeight: number;
    agentId: string;
    actionClass: string;
    explorerUrl: string;
  };
  computed: {
    inputHash: string;
    outputHash: string;
  };
  details: {
    inputMatch: boolean;
    outputMatch: boolean;
    rpcParseError?: string;
  };
}

export interface RecordResponse {
  success: boolean;
  decisionId: number;
  inputHash: string;
  outputHash: string;
  txHash: string;
  explorerUrl: string;
}

export const api = {
  getDecisions: (agent?: string) => {
    const params = agent && agent !== "all" ? `?agent=${agent}` : "";
    return apiFetch<DecisionsResponse>(`/api/decisions${params}`);
  },
  getDecision: (id: number) => apiFetch<DecisionRecord>(`/api/decisions/${id}`),
  getStats: () => apiFetch<StatsResponse>("/api/stats"),
  verify: (decisionId: number, inputData: any, outputData: any) =>
    apiFetch<VerifyResponse>("/api/verify", {
      method: "POST",
      body: JSON.stringify({ decisionId, inputData, outputData }),
    }),
  record: (data: {
    agentId: string;
    actionClass: string;
    inputData: any;
    outputData: any;
    jobPaymentRefHash?: string;
  }) =>
    apiFetch<RecordResponse>("/api/record", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  health: () => apiFetch<{ status: string; decisions: number }>("/api/health"),
};
