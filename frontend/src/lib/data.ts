import type { Stats, Item, Activity } from "./types";

/**
 * Starter data — Aurora replaces with real API calls.
 *
 * These are structured placeholders, NOT mock data.
 * Replace each function with a call to api.ts when your backend is ready.
 */

export function getStats(): Stats[] {
  return [
    { label: "Total Users", value: 1284, change: 12.5, suffix: "" },
    { label: "Active Now", value: 42, change: -3.2, suffix: "" },
    { label: "Revenue", value: 8420, change: 8.1, prefix: "$" },
    { label: "Transactions", value: 356, change: 24.7, suffix: "" },
  ];
}

export function getItems(): Item[] {
  return [
    {
      id: "1",
      title: "Smart Contract Auditor",
      description: "Automated security analysis for Solidity contracts",
      category: "Security",
      status: "active",
      value: 2500,
      createdAt: "2026-04-01",
      metadata: { chain: "Ethereum", audits: "142" },
    },
    {
      id: "2",
      title: "DeFi Yield Optimizer",
      description: "Cross-protocol yield farming with risk management",
      category: "DeFi",
      status: "active",
      value: 15000,
      createdAt: "2026-03-28",
      metadata: { tvl: "$2.4M", apy: "12.3%" },
    },
    {
      id: "3",
      title: "NFT Analytics Engine",
      description: "Real-time floor price tracking and rarity scoring",
      category: "Analytics",
      status: "pending",
      value: 800,
      createdAt: "2026-03-25",
      metadata: { collections: "450", accuracy: "94%" },
    },
    {
      id: "4",
      title: "Cross-Chain Bridge Monitor",
      description: "Live monitoring of bridge liquidity and transaction flow",
      category: "Infrastructure",
      status: "active",
      value: 5200,
      createdAt: "2026-03-20",
      metadata: { chains: "8", uptime: "99.9%" },
    },
    {
      id: "5",
      title: "MEV Protection Layer",
      description: "Transaction shielding against sandwich attacks",
      category: "Security",
      status: "completed",
      value: 3100,
      createdAt: "2026-03-15",
      metadata: { protected: "$45M", attacks_blocked: "1.2K" },
    },
    {
      id: "6",
      title: "DAO Governance Dashboard",
      description: "Proposal tracking, voting analytics, and delegation",
      category: "Governance",
      status: "active",
      value: 1900,
      createdAt: "2026-03-10",
      metadata: { daos: "28", proposals: "340" },
    },
  ];
}

export function getItem(id: string): Item | undefined {
  return getItems().find((item) => item.id === id);
}

export function getActivities(): Activity[] {
  return [
    {
      id: "a1",
      action: "New registration",
      detail: "Smart Contract Auditor activated",
      timestamp: "2 min ago",
      status: "success",
    },
    {
      id: "a2",
      action: "Transaction processed",
      detail: "0.45 SOL payment confirmed",
      timestamp: "8 min ago",
      status: "success",
    },
    {
      id: "a3",
      action: "Alert triggered",
      detail: "Unusual activity on Bridge Monitor",
      timestamp: "15 min ago",
      status: "pending",
    },
    {
      id: "a4",
      action: "Audit completed",
      detail: "No critical vulnerabilities found",
      timestamp: "1 hour ago",
      status: "success",
    },
    {
      id: "a5",
      action: "Error detected",
      detail: "API timeout on yield calculation",
      timestamp: "2 hours ago",
      status: "error",
    },
  ];
}
