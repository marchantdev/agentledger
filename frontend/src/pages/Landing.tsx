import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Github, BookOpen, Shield, ExternalLink, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { theme, densityMap } from "../theme.config";
import { api } from "../lib/api";

const valueProps = [
  {
    title: "Verifiable Receipts for Paid Work",
    description:
      "Every agent decision is hashed and recorded on Casper. If an agent gets paid, it leaves a receipt. One transaction, one tamper-proof record.",
  },
  {
    title: "Tamper Detection Built In",
    description:
      "Verify any decision against its on-chain attestation. If a single character changes, the hash breaks. Instant proof of integrity or tampering.",
  },
  {
    title: "Real-Time Audit Trail",
    description:
      "Query any agent's complete decision history on-chain. Click through to Casper explorer for cryptographic proof. Third-party verifiable.",
  },
];

const CONTRACT_HASH = "contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a";

export default function Landing() {
  const density = densityMap[theme.ui.density];
  const [totalDecisions, setTotalDecisions] = useState(6);
  const [totalAgents, setTotalAgents] = useState(4);

  useEffect(() => {
    api.getStats().then((s) => {
      setTotalDecisions(s.totalDecisions);
      setTotalAgents(s.totalAgents);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Navbar />

      {theme.features.showHero && (
        <Hero
          badge="Casper Agentic Buildathon 2026"
          title="If an agent gets paid,"
          highlight="it leaves a receipt."
          subtitle="AgentLedger is the accountability layer for autonomous AI agents. Record decisions on-chain, prove integrity, detect tampering — all on Casper's immutable ledger."
          primaryCta={{ label: "Try Verification", to: "/verify" }}
          secondaryCta={{ label: "Open Dashboard", to: "/dashboard" }}
        />
      )}

      <div className={`section ${density.section}`}>
        <div className={`grid grid-cols-1 md:grid-cols-3 ${density.gap}`}>
          {valueProps.map((prop, i) => (
            <div
              key={prop.title}
              className={`card-hover ${theme.ui.radius} ${density.card} animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <h3
                className="font-semibold text-lg"
                style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
              >
                {prop.title}
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: theme.colors.textMuted }}>
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className={`section ${density.section}`}>
        <h2
          className="text-xl font-semibold mb-6 text-center"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Agent Makes Decision",
              desc: "An AI agent approves a payment, executes a trade, or flags a risk. The input and output data are captured.",
            },
            {
              step: "2",
              title: "Hash Recorded On-Chain",
              desc: "Input/output are SHA-256 hashed and submitted to the Casper DecisionRegistry contract. Immutable receipt.",
            },
            {
              step: "3",
              title: "Verify Anytime",
              desc: "Re-hash the original data and compare to on-chain. If anything was changed, the hashes won't match.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={`${theme.ui.radius} p-4 border text-center`}
              style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold"
                style={{ backgroundColor: theme.colors.primary + "20", color: theme.colors.primary }}
              >
                {item.step}
              </div>
              <h3 className="font-semibold text-sm" style={{ color: theme.colors.text }}>{item.title}</h3>
              <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {theme.features.showProofSection && (
        <div className={`section ${density.section}`}>
          <div
            className={`${theme.ui.radius} p-8 border`}
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
          >
            <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: theme.colors.text }}>
              Built on Casper. Verified on-chain.
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Decisions Recorded", value: String(totalDecisions) },
                { label: "Agents Registered", value: String(totalAgents) },
                { label: "Chain", value: "Casper" },
                { label: "Contract", value: "Live" },
              ].map((point) => (
                <div key={point.label} className="text-center">
                  <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.accent }}>
                    {point.value}
                  </p>
                  <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                    {point.label}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="flex items-center justify-center gap-6 mt-6 pt-6 border-t flex-wrap"
              style={{ borderColor: theme.colors.border }}
            >
              <a
                href="https://github.com/aurora-ai-labs/agentledger"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: theme.colors.textMuted }}
              >
                <Github size={16} /> GitHub
              </a>
              <a
                href="/about"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: theme.colors.textMuted }}
              >
                <BookOpen size={16} /> Docs
              </a>
              <a
                href={`https://testnet.cspr.live/contract/${CONTRACT_HASH}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: theme.colors.textMuted }}
              >
                <Shield size={16} /> Contract
              </a>
              <a
                href="https://testnet.cspr.live"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: theme.colors.textMuted }}
              >
                <ExternalLink size={16} /> Explorer
              </a>
            </div>
          </div>
        </div>
      )}

      <div className={`section ${density.section} pb-20`}>
        <div className={`card-glass ${theme.ui.radius} text-center py-16 px-8`}>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>
            Make your agents accountable
          </h2>
          <p className="mt-3 max-w-md mx-auto" style={{ color: theme.colors.textMuted }}>
            If an agent gets paid, it should leave a receipt. Try the tamper-detection verifier.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link to="/verify" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              <ShieldCheck size={18} /> Try Verification
            </Link>
            <Link to="/dashboard" className="btn-outline text-base px-8 py-3">
              Open Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t py-8" style={{ borderColor: theme.colors.border }}>
        <div className="section flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            &copy; 2026 {theme.name}. Built for the Casper Agentic Buildathon.
          </p>
          <div className="flex gap-4">
            {theme.navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: theme.colors.textMuted }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
