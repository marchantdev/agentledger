/** AgentLedger type definitions */

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
