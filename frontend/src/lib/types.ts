/** AgentLedger type definitions */

export interface AgentTrace {
  policy_version: string;
  decision_factors: string[];
  risk_score: number;
  agent_reasoning_summary: string;
  agent_type: "deterministic_policy"; // honest: not a frontier LLM
}

export interface DecisionRecord {
  decisionId: number;
  agentId: string;
  actionClass: string;
  inputHash: string;
  outputHash: string;
  jobPaymentRefHash?: string;
  txHash: string;
  blockHeight: number;
  timestamp: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  trace?: AgentTrace;
}

export interface AgentSummary {
  agentId: string;
  totalDecisions: number;
  lastAction: string;
  lastTimestamp: string;
}

export interface Stats {
  label: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
}
