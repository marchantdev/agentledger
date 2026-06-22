import { Github, Globe, BookOpen, Shield, Code, Terminal } from "lucide-react";
import { theme, densityMap } from "../theme.config";

export default function About() {
  const density = densityMap[theme.ui.density];

  return (
    <div className="max-w-3xl space-y-8 animate-slide-up">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Documentation
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          {theme.tagline}
        </p>
      </div>

      <div className={`card ${theme.ui.radius} ${density.card}`}>
        <h2 className="font-semibold mb-3" style={{ color: theme.colors.text }}>
          What is AgentLedger?
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: theme.colors.textMuted }}
        >
          AgentLedger is an on-chain decision registry for autonomous AI agents.
          Every agent decision — trades, rebalances, risk alerts — gets a
          cryptographic hash recorded on Casper's immutable ledger. This creates a
          tamper-proof audit trail that any third party can verify.
        </p>
        <p
          className="text-sm leading-relaxed mt-3"
          style={{ color: theme.colors.textMuted }}
        >
          As AI agents manage increasing amounts of capital and make autonomous
          decisions, accountability becomes critical. AgentLedger provides the
          infrastructure to prove what decisions were made, when, and with what
          inputs — especially for agents performing paid work.
        </p>
      </div>

      <div className={`card ${theme.ui.radius} ${density.card}`}>
        <h2 className="font-semibold mb-3" style={{ color: theme.colors.text }}>
          Quick Start
        </h2>
        <div
          className="rounded-lg p-4 text-sm font-mono overflow-x-auto"
          style={{ backgroundColor: theme.colors.surfaceAlt }}
        >
          <pre style={{ color: theme.colors.text }}>
{`// Record a decision via the AgentLedger API
const res = await fetch("/api/record", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agentId: "treasury-agent-01",
    actionClass: "vendor_payment_approval",
    inputData: { invoice_id: "INV-2026-0847", vendor: "CloudServ Inc", amount: 10000 },
    outputData: { decision: "APPROVED", reason: "Within budget" },
    jobPaymentRefHash: "x402-job-0x7f3a2b1c",
  }),
});

const { txHash, explorerUrl } = await res.json();
console.log("On-chain:", explorerUrl);

// Verify — re-hash the data and compare to on-chain record
const verify = await fetch("/api/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ decisionId: 0, inputData: {...}, outputData: {...} }),
});
// { verified: true, chainVerified: true, chainStatus: "finalized" }`}
          </pre>
        </div>
      </div>

      <div className={`card ${theme.ui.radius} ${density.card}`}>
        <h2 className="font-semibold mb-4" style={{ color: theme.colors.text }}>
          Tech Stack
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            "Odra 2.8 (Rust)",
            "Casper 2.0",
            "TypeScript SDK",
            "React + Vite",
            "Tailwind CSS",
            "Casper RPC",
          ].map((tech) => (
            <div
              key={tech}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: theme.colors.surfaceAlt,
                color: theme.colors.textMuted,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.colors.primary }}
              />
              {tech}
            </div>
          ))}
        </div>
      </div>

      <div className={`card ${theme.ui.radius} ${density.card}`}>
        <h2 className="font-semibold mb-3" style={{ color: theme.colors.text }}>
          Contract Interface
        </h2>
        <div
          className="rounded-lg p-4 text-sm font-mono overflow-x-auto"
          style={{ backgroundColor: theme.colors.surfaceAlt }}
        >
          <pre style={{ color: theme.colors.textMuted }}>
{`// Record a new agent decision with optional job/payment reference
record_decision(
  agent_id: String,
  action_class: String,
  input_hash: String,
  output_hash: String,
  job_payment_ref_hash: String,  // links to x402 payment receipt
) -> u64  // returns decision_id

// Query a specific decision
get_decision(id: u64) -> DecisionRecord

// Get total decisions across all agents
get_total_decisions() -> u64

// Get decision count for a specific agent
get_agent_decision_count(agent_id: String) -> u64`}
          </pre>
        </div>
      </div>

      <div className={`card ${theme.ui.radius} ${density.card}`}>
        <h2 className="font-semibold mb-4" style={{ color: theme.colors.text }}>
          Links
        </h2>
        <div className="space-y-3">
          {[
            {
              icon: Github,
              label: "GitHub Repository",
              href: "https://github.com/marchantdev/agentledger",
            },
            {
              icon: Globe,
              label: "Casper Testnet Explorer",
              href: "https://testnet.cspr.live",
            },
            {
              icon: Shield,
              label: "Casper Developer Docs",
              href: "https://docs.casper.network",
            },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm transition-opacity hover:opacity-80 group"
              style={{ color: theme.colors.textMuted }}
            >
              <Icon size={18} /> {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
