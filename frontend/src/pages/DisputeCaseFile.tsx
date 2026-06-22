import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ArrowRight,
  Hash,
  Scale,
  Clock,
  DollarSign,
  User,
  Box,
  ChevronRight,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { VerifyResponse } from "../lib/api";

type Phase = "intro" | "claim" | "evidence" | "tamper" | "verdict";

const DISPUTE_DECISION_ID = 0;

// The vendor's fraudulent claim
const VENDOR_CLAIM = {
  vendor: "CloudServ Inc",
  claimedAmount: 15000,
  invoiceId: "INV-2026-0847",
  claimDate: "2026-06-22",
  claimReason: "Agent approved $15,000 for Q2 infrastructure services. Only $10,000 was received.",
};

// What the on-chain record actually shows
const ON_CHAIN_TRUTH = {
  approvedAmount: 10000,
  currency: "USDT",
  agentId: "treasury-agent-01",
  policyVersion: "treasury-v2.1",
  confidence: 0.94,
};

export default function DisputeCaseFile() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [tamperResult, setTamperResult] = useState<VerifyResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tamperVerifying, setTamperVerifying] = useState(false);

  const handleVerifyOriginal = useCallback(async () => {
    setVerifying(true);
    try {
      const decision = await api.getDecision(DISPUTE_DECISION_ID);
      const result = await api.verify(
        decision.decisionId,
        decision.inputData || {},
        decision.outputData || {},
      );
      setVerifyResult(result);
    } catch {
      setVerifyResult(null);
    } finally {
      setVerifying(false);
    }
  }, []);

  const handleVerifyTampered = useCallback(async () => {
    setTamperVerifying(true);
    try {
      const decision = await api.getDecision(DISPUTE_DECISION_ID);
      // Vendor's version: claiming $15,000 was approved
      const tamperedOutput = {
        ...(decision.outputData || {}),
        payment_amount: VENDOR_CLAIM.claimedAmount,
        reason: "Within budget threshold (33%)",
      };
      const result = await api.verify(
        decision.decisionId,
        decision.inputData || {},
        tamperedOutput,
      );
      setTamperResult(result);
    } catch {
      setTamperResult(null);
    } finally {
      setTamperVerifying(false);
    }
  }, []);

  const advancePhase = () => {
    const order: Phase[] = ["intro", "claim", "evidence", "tamper", "verdict"];
    const idx = order.indexOf(phase);
    if (idx < order.length - 1) setPhase(order[idx + 1]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: theme.colors.textMuted }}>
          <Scale size={12} />
          <span>Dispute Resolution Demo</span>
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: theme.colors.text, fontFamily: theme.fonts.headline }}
        >
          Payment Dispute Case File
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
          A vendor claims an AI agent approved $15,000 — but the blockchain tells a different story.
        </p>
      </div>

      {/* Phase progress */}
      <div className="flex items-center gap-1">
        {(["intro", "claim", "evidence", "tamper", "verdict"] as Phase[]).map((p, i) => {
          const labels = ["Scenario", "Claim", "Evidence", "Tamper Test", "Verdict"];
          const order: Phase[] = ["intro", "claim", "evidence", "tamper", "verdict"];
          const currentIdx = order.indexOf(phase);
          const isActive = p === phase;
          const isDone = i < currentIdx;
          return (
            <div key={p} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => { if (isDone) setPhase(p); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${isDone ? "cursor-pointer" : isActive ? "" : "cursor-default opacity-40"}`}
                style={{
                  backgroundColor: isDone ? theme.colors.success + "20" : isActive ? theme.colors.primary + "20" : "transparent",
                  color: isDone ? theme.colors.success : isActive ? theme.colors.primary : theme.colors.textMuted,
                }}
              >
                {isDone ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]" style={{ borderColor: isActive ? theme.colors.primary : theme.colors.border }}>{i + 1}</span>}
                <span className="hidden sm:inline">{labels[i]}</span>
              </button>
              {i < 4 && <ChevronRight size={12} className="flex-shrink-0" style={{ color: theme.colors.border }} />}
            </div>
          );
        })}
      </div>

      {/* Phase: Intro */}
      {phase === "intro" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <FileText size={16} style={{ color: theme.colors.accent }} />
              The Scenario
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
              <p>
                An autonomous treasury agent (<span className="font-mono text-xs" style={{ color: theme.colors.text }}>treasury-agent-01</span>) manages vendor payments for a fund. It processes invoices, checks budgets, and approves payments — all without human intervention.
              </p>
              <p>
                Every decision the agent makes is recorded on <span style={{ color: theme.colors.primary }}>Casper's blockchain</span> via AgentLedger. The input data (invoice details) and output data (approval/rejection + amount) are SHA-256 hashed and stored immutably on-chain.
              </p>
              <p>
                Three weeks later, a vendor files a payment dispute...
              </p>
            </div>
          </div>

          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <Clock size={16} style={{ color: theme.colors.accent }} />
              Timeline
            </h2>
            <div className="space-y-0">
              {[
                { date: "Jun 21", event: "Agent processes invoice INV-2026-0847 from CloudServ Inc", icon: <Box size={14} />, color: theme.colors.primary },
                { date: "Jun 21", event: "Decision recorded on Casper testnet (block #8,256,786)", icon: <Shield size={14} />, color: theme.colors.success },
                { date: "Jun 22", event: "CloudServ Inc files payment dispute claiming $15,000 was approved", icon: <AlertTriangle size={14} />, color: theme.colors.error },
                { date: "Now", event: "You investigate using AgentLedger's on-chain records", icon: <Scale size={14} />, color: theme.colors.accent },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + "20", color: item.color }}>
                      {item.icon}
                    </div>
                    {i < 3 && <div className="w-px flex-1 my-1" style={{ backgroundColor: theme.colors.border }} />}
                  </div>
                  <div className="pb-4">
                    <span className="text-xs font-medium" style={{ color: item.color }}>{item.date}</span>
                    <p className="text-sm" style={{ color: theme.colors.text }}>{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={advancePhase} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            Begin Investigation <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Phase: Claim */}
      {phase === "claim" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`${theme.ui.radius} border p-5`} style={{ borderColor: theme.colors.error + "40", backgroundColor: theme.colors.error + "06" }}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} style={{ color: theme.colors.error }} className="flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold" style={{ color: theme.colors.error }}>Vendor Dispute Filed</h2>
                <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>Filed by CloudServ Inc on {VENDOR_CLAIM.claimDate}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: theme.colors.surface }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Vendor</span>
                  <p className="text-sm font-medium" style={{ color: theme.colors.text }}>{VENDOR_CLAIM.vendor}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Invoice</span>
                  <p className="text-sm font-mono" style={{ color: theme.colors.text }}>{VENDOR_CLAIM.invoiceId}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Claimed Amount</span>
                  <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.error }}>
                    ${VENDOR_CLAIM.claimedAmount.toLocaleString()} <span className="text-sm font-normal">USDT</span>
                  </p>
                </div>
              </div>
              <div className="border-t pt-3" style={{ borderColor: theme.colors.border }}>
                <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Dispute Statement</span>
                <p className="text-sm mt-1 italic" style={{ color: theme.colors.text }}>
                  "{VENDOR_CLAIM.claimReason}"
                </p>
              </div>
            </div>
          </div>

          <div className={`card ${theme.ui.radius}`}>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Without on-chain records, resolving this dispute would require digging through logs, emails, and internal databases — all of which can be altered. With AgentLedger, the answer is on the blockchain.
            </p>
          </div>

          <button onClick={advancePhase} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            Check On-Chain Evidence <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Phase: Evidence */}
      {phase === "evidence" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: theme.colors.text }}>
              <Shield size={16} style={{ color: theme.colors.success }} />
              On-Chain Record (Decision #0)
            </h2>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Vendor's claim */}
              <div className="p-3 rounded-lg border" style={{ borderColor: theme.colors.error + "40", backgroundColor: theme.colors.error + "06" }}>
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} style={{ color: theme.colors.error }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.error }}>Vendor Claims</span>
                </div>
                <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.error }}>
                  ${VENDOR_CLAIM.claimedAmount.toLocaleString()}
                </p>
              </div>

              {/* On-chain truth */}
              <div className="p-3 rounded-lg border" style={{ borderColor: theme.colors.success + "40", backgroundColor: theme.colors.success + "06" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} style={{ color: theme.colors.success }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.success }}>On-Chain Record</span>
                </div>
                <p className="text-2xl font-bold font-mono" style={{ color: theme.colors.success }}>
                  ${ON_CHAIN_TRUTH.approvedAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ backgroundColor: theme.colors.surfaceAlt }}>
              <DollarSign size={16} style={{ color: theme.colors.accent }} />
              <p className="text-sm" style={{ color: theme.colors.text }}>
                Discrepancy: <strong className="font-mono" style={{ color: theme.colors.error }}>${(VENDOR_CLAIM.claimedAmount - ON_CHAIN_TRUTH.approvedAmount).toLocaleString()}</strong> — vendor claims 50% more than the on-chain record shows.
              </p>
            </div>

            {/* Decision details from chain */}
            <div className="space-y-2">
              {[
                { label: "Agent", value: ON_CHAIN_TRUTH.agentId },
                { label: "Policy", value: ON_CHAIN_TRUTH.policyVersion },
                { label: "Approved Amount", value: `$${ON_CHAIN_TRUTH.approvedAmount.toLocaleString()} ${ON_CHAIN_TRUTH.currency}` },
                { label: "Confidence", value: `${(ON_CHAIN_TRUTH.confidence * 100).toFixed(0)}%` },
                { label: "Block", value: "#8,256,786" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: theme.colors.border + "40" }}>
                  <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>{row.label}</span>
                  <span className="text-sm font-mono" style={{ color: theme.colors.text }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verify button */}
          <div className={`${theme.ui.radius} border p-4`} style={{ borderColor: theme.colors.primary + "40", backgroundColor: theme.colors.primary + "06" }}>
            {!verifyResult ? (
              <button
                onClick={handleVerifyOriginal}
                disabled={verifying}
                className="w-full flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.primary + "20" }}>
                  {verifying ? <Loader2 size={20} className="animate-spin" style={{ color: theme.colors.primary }} /> : <ShieldCheck size={20} style={{ color: theme.colors.primary }} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                    {verifying ? "Verifying against Casper RPC..." : "Verify Original Data On-Chain"}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Re-hash the original decision data and compare to the immutable on-chain record.
                  </p>
                </div>
                {!verifying && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: theme.colors.primary, color: "#000" }}>
                    Verify
                  </span>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {verifyResult.verified ? (
                  <ShieldCheck size={24} style={{ color: theme.colors.success }} />
                ) : (
                  <ShieldX size={24} style={{ color: theme.colors.error }} />
                )}
                <div>
                  <p className="text-sm font-bold" style={{ color: verifyResult.verified ? theme.colors.success : theme.colors.error }}>
                    {verifyResult.verified ? "VERIFIED" : "MISMATCH"}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {verifyResult.verified
                      ? "Original data matches the on-chain hashes exactly. The agent approved $10,000."
                      : "Could not verify against chain."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button onClick={advancePhase} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            Test the Vendor's Claim <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Phase: Tamper Test */}
      {phase === "tamper" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`card ${theme.ui.radius}`}>
            <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: theme.colors.text }}>
              <AlertTriangle size={16} style={{ color: theme.colors.error }} />
              Tamper Test: Vendor's Version
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
              What if we submit the vendor's claimed amount ($15,000) to the verification system? If the on-chain hash was computed from $15,000, it would match. If it was $10,000, it won't.
            </p>

            {/* Show what we're changing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Original Output</span>
                <pre className="text-xs font-mono mt-1 whitespace-pre-wrap" style={{ color: theme.colors.text }}>
{`{
  "decision": "APPROVED",
  "payment_amount": 10000,
  ...
}`}
                </pre>
              </div>
              <div className="p-3 rounded-lg border" style={{ backgroundColor: theme.colors.error + "06", borderColor: theme.colors.error + "30" }}>
                <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.error }}>Vendor's Version</span>
                <pre className="text-xs font-mono mt-1 whitespace-pre-wrap" style={{ color: theme.colors.text }}>
{`{
  "decision": "APPROVED",
  "payment_amount": `}<span style={{ color: theme.colors.error, fontWeight: "bold" }}>15000</span>{`,
  ...
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Tamper verify button */}
          <div className={`${theme.ui.radius} border p-4`} style={{ borderColor: theme.colors.error + "40", backgroundColor: theme.colors.error + "06" }}>
            {!tamperResult ? (
              <button
                onClick={handleVerifyTampered}
                disabled={tamperVerifying}
                className="w-full flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.error + "20" }}>
                  {tamperVerifying ? <Loader2 size={20} className="animate-spin" style={{ color: theme.colors.error }} /> : <ShieldX size={20} style={{ color: theme.colors.error }} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                    {tamperVerifying ? "Checking vendor's claim against chain..." : "Submit Vendor's Claimed Amount for Verification"}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Hash the vendor's version ($15,000) and compare to the on-chain record.
                  </p>
                </div>
                {!tamperVerifying && (
                  <span className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: theme.colors.error, color: "#fff" }}>
                    Test Claim
                  </span>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {tamperResult.verified ? (
                    <ShieldCheck size={24} style={{ color: theme.colors.success }} />
                  ) : (
                    <ShieldX size={24} style={{ color: theme.colors.error }} />
                  )}
                  <div>
                    <p className="text-sm font-bold" style={{ color: tamperResult.verified ? theme.colors.success : theme.colors.error }}>
                      {tamperResult.verified ? "MATCH" : "HASH MISMATCH — CLAIM DISPROVED"}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                      {tamperResult.verified
                        ? "The vendor's claim matches the chain."
                        : "The vendor's claimed amount produces a different hash. The on-chain record proves $10,000 was approved, not $15,000."}
                    </p>
                  </div>
                </div>
                {/* Show the hash mismatch */}
                {!tamperResult.verified && (
                  <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                    <div>
                      <span className="text-xs" style={{ color: theme.colors.textMuted }}>On-chain output hash:</span>
                      <p className="text-xs font-mono truncate" style={{ color: theme.colors.success }} title={tamperResult.onChain.outputHash ?? ""}>
                        {tamperResult.onChain.outputHash ?? "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: theme.colors.textMuted }}>Computed from vendor's claim:</span>
                      <p className="text-xs font-mono truncate" style={{ color: theme.colors.error }} title={tamperResult.computed.outputHash}>
                        {tamperResult.computed.outputHash}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <XCircle size={14} style={{ color: theme.colors.error }} />
                      <span className="text-xs font-medium" style={{ color: theme.colors.error }}>These hashes don't match — the data was different.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={advancePhase} className="btn-primary flex items-center justify-center gap-2 w-full py-3">
            See Verdict <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Phase: Verdict */}
      {phase === "verdict" && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Verdict banner */}
          <div
            className={`p-6 ${theme.ui.radius}`}
            style={{ backgroundColor: theme.colors.success + "10", borderLeft: `4px solid ${theme.colors.success}` }}
          >
            <div className="flex items-start gap-4">
              <Scale size={32} style={{ color: theme.colors.success }} className="flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold" style={{ color: theme.colors.success, fontFamily: theme.fonts.headline }}>
                  Dispute Resolved
                </h2>
                <p className="text-sm mt-2" style={{ color: theme.colors.text }}>
                  The on-chain record proves the agent approved <strong className="font-mono">${ON_CHAIN_TRUTH.approvedAmount.toLocaleString()} USDT</strong>, not ${VENDOR_CLAIM.claimedAmount.toLocaleString()}. The vendor's claim is <span style={{ color: theme.colors.error }}>disproved</span> by cryptographic evidence.
                </p>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className={`card ${theme.ui.radius}`}>
            <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: theme.colors.text }}>
              <FileText size={16} style={{ color: theme.colors.accent }} />
              Resolution Summary
            </h3>
            <div className="space-y-3">
              {[
                { icon: <CheckCircle size={14} />, text: "Original decision data verified against Casper on-chain hashes", color: theme.colors.success },
                { icon: <XCircle size={14} />, text: "Vendor's claimed amount ($15,000) produces a different hash — disproved", color: theme.colors.error },
                { icon: <Shield size={14} />, text: "On-chain record is immutable — cannot be altered after the fact", color: theme.colors.primary },
                { icon: <Clock size={14} />, text: "Resolution time: seconds, not weeks of forensic investigation", color: theme.colors.accent },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: item.color }}>{item.icon}</span>
                  <p className="text-sm" style={{ color: theme.colors.text }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why this matters */}
          <div className={`card ${theme.ui.radius}`} style={{ borderLeft: `3px solid ${theme.colors.primary}` }}>
            <h3 className="font-semibold mb-2" style={{ color: theme.colors.text }}>Why This Matters</h3>
            <p className="text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>
              As AI agents manage more capital and make more autonomous decisions, disputes will increase. Without verifiable records, resolving them requires expensive forensics, trust assumptions, and legal processes. AgentLedger provides <strong style={{ color: theme.colors.text }}>cryptographic proof on Casper's blockchain</strong> — any party can independently verify what happened, in seconds, without trusting anyone.
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Link
              to="/receipt/0"
              className="flex items-center justify-center gap-2 flex-1 py-2.5 text-sm rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
            >
              <FileText size={14} /> View Full Receipt
            </Link>
            <Link
              to="/verify"
              className="flex items-center justify-center gap-2 flex-1 py-2.5 text-sm rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: theme.colors.accent, color: theme.colors.accent }}
            >
              <Shield size={14} /> Try Verify Tool
            </Link>
          </div>

          {/* Restart */}
          <button
            onClick={() => { setPhase("intro"); setVerifyResult(null); setTamperResult(null); }}
            className="w-full text-center text-xs py-2 transition-opacity hover:opacity-80"
            style={{ color: theme.colors.textMuted }}
          >
            Restart case file demo
          </button>
        </div>
      )}
    </div>
  );
}
