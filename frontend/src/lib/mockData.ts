import type { DecisionRecord, AgentSummary } from "./types";

/**
 * Mock decision data — simulates on-chain DecisionRegistry reads.
 * Replace with real Casper RPC / CSPR.cloud calls once contract is deployed.
 */

const AGENTS = [
  "trading-agent-alpha",
  "rebalance-bot-v2",
  "risk-monitor-eu",
  "yield-optimizer-3",
];

const ACTION_CLASSES = [
  "swap",
  "rebalance",
  "risk-alert",
  "yield-harvest",
  "position-close",
  "limit-order",
  "hedge",
];

function sha256Mock(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").repeat(8);
}

const BASE_TIME = new Date("2026-06-19T10:00:00Z").getTime();

export const mockDecisions: DecisionRecord[] = Array.from({ length: 24 }, (_, i) => {
  const agent = AGENTS[i % AGENTS.length];
  const action = ACTION_CLASSES[i % ACTION_CLASSES.length];
  const ts = new Date(BASE_TIME + i * 180_000); // 3 min apart

  return {
    decisionId: i,
    agentId: agent,
    actionClass: action,
    inputHash: sha256Mock(`input-${agent}-${i}`),
    outputHash: sha256Mock(`output-${agent}-${i}-${action}`),
    blockHeight: 8232400 + i * 3,
    timestamp: ts.toISOString(),
    deployHash: sha256Mock(`deploy-${i}`).slice(0, 64),
  };
}).reverse();

export const mockAgents: AgentSummary[] = AGENTS.map((agentId) => {
  const agentDecisions = mockDecisions.filter((d) => d.agentId === agentId);
  const latest = agentDecisions[0];
  return {
    agentId,
    totalDecisions: agentDecisions.length,
    lastAction: latest?.actionClass ?? "none",
    lastTimestamp: latest?.timestamp ?? "",
  };
});

export const mockStats = {
  totalDecisions: mockDecisions.length,
  totalAgents: AGENTS.length,
  latestBlock: mockDecisions[0]?.blockHeight ?? 0,
  avgDecisionsPerHour: 20,
};
