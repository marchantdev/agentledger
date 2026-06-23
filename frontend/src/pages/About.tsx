import { Github, Globe, BookOpen, Shield, Code, Terminal, Zap, CheckCircle, Lock, Search, Link as LinkIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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

      {/* Why Casper? */}
      <div
        className={`${theme.ui.radius} border overflow-hidden`}
        style={{ borderColor: theme.colors.primary + "30", backgroundColor: theme.colors.surface }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.primary + "06" }}
        >
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
          >
            <Shield size={20} style={{ color: theme.colors.primary }} />
            Why Casper?
          </h2>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
            AgentLedger is built on Casper because agent commerce demands specific blockchain properties — not just "decentralization."
          </p>
        </div>

        <div className="p-5 space-y-4">
          {[
            {
              icon: Lock,
              title: "Deterministic Finality",
              description: "Once a decision hash is recorded on Casper, it is final. No reorganizations, no probabilistic confirmation windows. When the receipt says block #8,256,786, that block will never change. This matters for compliance — auditors need certainty, not probability.",
            },
            {
              icon: Shield,
              title: "Tamper-Evident by Design",
              description: "The Odra smart contract stores only SHA-256 hashes — the input hash, output hash, and job/payment reference hash. Any modification to the original data produces a completely different hash. Verification is binary: match or mismatch. There is no ambiguity.",
            },
            {
              icon: Search,
              title: "RPC Verification Without Backend Trust",
              description: "Anyone can call the Casper RPC endpoint directly, fetch the transaction, extract the named arguments (input_hash, output_hash), and compare them to their own computed hashes. No AgentLedger backend needed. No trust assumptions. The chain is the arbiter.",
            },
            {
              icon: LinkIcon,
              title: "x402-Ready Payment Binding",
              description: "Each receipt includes a hashed job and payment reference (x402-ready). The verifier confirms that this receipt corresponds to this specific payment — you can't swap receipts between jobs or claim a different payment was associated with a decision. When x402 micropayments settle on-chain, this binding becomes the trust anchor for autonomous agent commerce.",
            },
            {
              icon: Zap,
              title: "Why This Matters for Agent Commerce",
              description: "As AI agents handle autonomous financial decisions, every party needs proof of what happened. The payer needs to verify the agent did what it was told. The agent operator needs an audit trail. Regulators need accountability. Casper's deterministic finality and transparent RPC make this possible without intermediaries.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary + "15" }}
                >
                  <Icon size={18} style={{ color: theme.colors.primary }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold" style={{ color: theme.colors.text }}>
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: theme.colors.textMuted }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Contract reference */}
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: theme.colors.surfaceAlt }}
          >
            <Code size={16} style={{ color: theme.colors.textMuted }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Contract package</p>
              <p className="text-xs font-mono truncate" style={{ color: theme.colors.text }}>
                hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb
              </p>
            </div>
            <a
              href="https://testnet.cspr.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex-shrink-0 px-2 py-1 rounded border transition-colors hover:bg-white/5"
              style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
            >
              Explorer
            </a>
          </div>

          <Link
            to="/job-flow"
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg"
            style={{ backgroundColor: theme.colors.primary, color: "#000" }}
          >
            See It In Action <ArrowRight size={14} />
          </Link>
        </div>
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
{`// Record a decision via the Agent Workbench API
const res = await fetch("/api/workbench/record", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-backend-secret": process.env.BACKEND_SECRET,
  },
  body: JSON.stringify({ scenario: "vendor_payment" }),
});

const { decision, txHash, explorerUrl } = await res.json();
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
{`// Record a new agent decision (x402-ready binding)
record_decision(
  agent_id: String,
  action_class: String,
  input_hash: String,
  output_hash: String,
  job_payment_ref_hash: String,  // x402-ready: binds decision to payment
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
