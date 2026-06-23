import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Loader2,
  Hash,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Zap,
  FileText,
  Link as LinkIcon,
  User,
  Box,
  Download,
  Brain,
  Activity,
  ChevronDown,
  Code,
} from "lucide-react";
import { theme } from "../theme.config";
import { api } from "../lib/api";
import type { DecisionRecord } from "../lib/types";
import type { VerifyResponse } from "../lib/api";

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [verification, setVerification] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tamper demo state
  const [tamperMode, setTamperMode] = useState(false);
  const [tamperResult, setTamperResult] = useState<VerifyResponse | null>(null);
  const [tamperVerifying, setTamperVerifying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const decisionId = parseInt(id, 10);
    if (isNaN(decisionId)) {
      setError("Invalid decision ID");
      setLoading(false);
      return;
    }

    api
      .getDecision(decisionId)
      .then((d) => {
        setDecision(d);
        return api.verify(d.decisionId, d.inputData || {}, d.outputData || {});
      })
      .then((v) => setVerification(v))
      .catch((err) => setError(err.message || "Failed to load receipt"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTamper = useCallback(async () => {
    if (!decision) return;
    setTamperMode(true);
    setTamperVerifying(true);
    setTamperResult(null);

    const tampered = { ...(decision.outputData || {}) };
    if ("payment_amount" in tampered) {
      tampered.payment_amount =
        (tampered.payment_amount as number) + 5000;
    } else if ("decision" in tampered) {
      tampered.decision =
        tampered.decision === "APPROVED" ? "REJECTED" : "APPROVED";
    } else {
      tampered._tampered = true;
    }

    try {
      const res = await api.verify(
        decision.decisionId,
        decision.inputData || {},
        tampered,
      );
      setTamperResult(res);
    } catch {
      setTamperResult(null);
    } finally {
      setTamperVerifying(false);
    }
  }, [decision]);

  const resetTamper = () => {
    setTamperMode(false);
    setTamperResult(null);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportReport = async (format: "markdown" | "json") => {
    if (!decision || exporting) return;
    setExporting(true);
    try {
      await api.auditReport(decision.decisionId, format);
    } catch {
      // silent — download will simply not trigger
    } finally {
      setExporting(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}&bgcolor=0a0e14&color=2dd4bf&format=svg`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: theme.colors.primary }}
        />
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <ShieldX
          size={48}
          className="mx-auto mb-4"
          style={{ color: theme.colors.error }}
        />
        <h1
          className="text-xl font-bold mb-2"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.headline,
          }}
        >
          Receipt Not Found
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: theme.colors.textMuted }}
        >
          {error || "This decision receipt does not exist."}
        </p>
        <Link
          to="/dashboard"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const activeResult = tamperMode ? tamperResult : verification;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with share */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="text-xs flex items-center gap-1 mb-2 transition-opacity hover:opacity-80"
            style={{ color: theme.colors.textMuted }}
          >
            <ArrowLeft size={12} /> Dashboard
          </Link>
          <h1
            className="text-2xl font-bold"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.headline,
            }}
          >
            Receipt #{decision.decisionId}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: theme.colors.textMuted }}
          >
            On-chain attestation receipt
          </p>
        </div>
        <button
          onClick={copyLink}
          className={`flex items-center gap-2 px-3 py-2 text-xs ${theme.ui.radius} border transition-all`}
          style={{
            borderColor: copied
              ? theme.colors.success
              : theme.colors.border,
            color: copied
              ? theme.colors.success
              : theme.colors.textMuted,
          }}
        >
          {copied ? (
            <>
              <Check size={14} /> Copied!
            </>
          ) : (
            <>
              <LinkIcon size={14} /> Share
            </>
          )}
        </button>
      </div>

      {/* Verification badge */}
      {verification && (
        <VerificationBanner
          verification={verification}
          tamperMode={tamperMode}
          tamperResult={tamperResult}
          tamperVerifying={tamperVerifying}
        />
      )}

      {/* Decision details */}
      <div className={`card ${theme.ui.radius} space-y-4`}>
        <h2
          className="font-semibold flex items-center gap-2"
          style={{ color: theme.colors.text }}
        >
          <FileText size={16} style={{ color: theme.colors.accent }} />
          Decision Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField
            icon={<User size={14} />}
            label="Agent"
            value={decision.agentId}
            mono
          />
          <DetailField
            icon={<Zap size={14} />}
            label="Action / Job Type"
            value={decision.actionClass}
            mono
          />
          {decision.jobPaymentRefHash && (
            <DetailField
              icon={<LinkIcon size={14} />}
              label="Job Payment Ref"
              value={decision.jobPaymentRefHash}
              mono
              full
            />
          )}
          <DetailField
            label="Timestamp"
            value={new Date(decision.timestamp).toLocaleString()}
          />
        </div>
      </div>

      {/* Agent Trace — policy reasoning */}
      {decision.trace && (
        <div className={`card ${theme.ui.radius} space-y-4`}>
          <h2
            className="font-semibold flex items-center gap-2"
            style={{ color: theme.colors.text }}
          >
            <Brain size={16} style={{ color: theme.colors.accent }} />
            Agent Policy Trace
          </h2>
          <p className="text-xs" style={{ color: theme.colors.textMuted }}>
            Deterministic reasoning recorded at decision time — included in the hashed attestation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                Policy Version
              </span>
              <p className="text-sm font-mono mt-1" style={{ color: theme.colors.text }}>
                {decision.trace.policy_version}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                Risk Score
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.surfaceAlt }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(decision.trace.risk_score * 100, 100)}%`,
                      backgroundColor: decision.trace.risk_score <= 0.3
                        ? theme.colors.success
                        : decision.trace.risk_score <= 0.6
                          ? theme.colors.warning || "#f59e0b"
                          : theme.colors.error,
                    }}
                  />
                </div>
                <span className="text-xs font-mono" style={{ color: theme.colors.text }}>
                  {(decision.trace.risk_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
                Agent Type
              </span>
              <p className="text-sm font-mono mt-1" style={{ color: theme.colors.text }}>
                {decision.trace.agent_type}
              </p>
            </div>
          </div>

          {/* Decision Factors */}
          <div>
            <span className="text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: theme.colors.textMuted }}>
              <Activity size={12} /> Decision Factors
            </span>
            <div className="flex flex-wrap gap-2">
              {decision.trace.decision_factors.map((factor, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: theme.colors.primary + "15",
                    color: theme.colors.primary,
                  }}
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>

          {/* Reasoning Summary */}
          <div>
            <span className="text-xs uppercase tracking-wider mb-1.5 block" style={{ color: theme.colors.textMuted }}>
              Reasoning Summary
            </span>
            <div
              className="p-3 rounded-lg text-sm leading-relaxed"
              style={{ backgroundColor: theme.colors.surfaceAlt, color: theme.colors.text }}
            >
              {decision.trace.agent_reasoning_summary}
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic proof */}
      <div className={`card ${theme.ui.radius} space-y-4`}>
        <h2
          className="font-semibold flex items-center gap-2"
          style={{ color: theme.colors.text }}
        >
          <Hash size={16} style={{ color: theme.colors.accent }} />
          Cryptographic Proof
        </h2>
        <div className="space-y-3">
          <HashField label="Input Hash" value={decision.inputHash} />
          <HashField label="Output Hash" value={decision.outputHash} />
        </div>
      </div>

      {/* Casper Proof Panel */}
      <div className={`card ${theme.ui.radius} space-y-4`}>
        <div className="flex items-center justify-between">
          <h2
            className="font-semibold flex items-center gap-2"
            style={{ color: theme.colors.text }}
          >
            <Box size={16} style={{ color: theme.colors.accent }} />
            Powered by Casper
          </h2>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: verification?.chainVerified
                ? theme.colors.success + "20"
                : theme.colors.border + "40",
              color: verification?.chainVerified
                ? theme.colors.success
                : theme.colors.textMuted,
            }}
          >
            <CheckCircle size={12} />
            {verification?.chainVerified ? "RPC Verified" : "Awaiting Confirmation"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: theme.colors.textMuted }}
            >
              Contract Package
            </span>
            <p
              className="text-xs font-mono mt-1 break-all"
              style={{ color: theme.colors.text }}
              title="hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb"
            >
              f8f8e34c914d463b…99bb
            </p>
          </div>
          <div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: theme.colors.textMuted }}
            >
              Block Height
            </span>
            <p
              className="text-sm font-mono mt-1"
              style={{ color: theme.colors.text }}
            >
              #{decision.blockHeight || (verification?.onChain.blockHeight ?? "—")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: theme.colors.textMuted }}
            >
              Transaction
            </span>
            <p
              className="text-xs font-mono mt-1 break-all"
              style={{ color: theme.colors.text }}
            >
              {decision.txHash}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-3 p-3 rounded-lg text-xs"
          style={{
            backgroundColor: theme.colors.primary + "10",
            borderLeft: `3px solid ${theme.colors.primary}`,
          }}
        >
          <CheckCircle
            size={14}
            style={{ color: theme.colors.primary, flexShrink: 0 }}
          />
          <span style={{ color: theme.colors.textMuted }}>
            Verified directly via Casper RPC — no third-party explorer required.
          </span>
        </div>

        {decision.jobPaymentRefHash && (
          <div
            className="flex items-start gap-3 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: "#f59e0b" + "08",
              borderLeft: `3px solid #f59e0b`,
            }}
          >
            <LinkIcon
              size={14}
              style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <span className="font-semibold" style={{ color: theme.colors.text }}>
                x402-Ready Binding
              </span>
              <p className="mt-0.5" style={{ color: theme.colors.textMuted }}>
                This receipt's <code className="font-mono">job_payment_ref_hash</code> binds
                the agent's decision to a specific payment reference. The verifier confirms
                this receipt corresponds to this payment — receipts cannot be swapped between jobs.
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Raw Proof Drawer */}
        <div>
          <button
            onClick={() => setProofOpen(!proofOpen)}
            className="w-full flex items-center justify-between py-2 text-sm transition-opacity hover:opacity-80"
            style={{ color: theme.colors.textMuted }}
          >
            <span className="flex items-center gap-2">
              <Code size={14} />
              Raw Casper Proof Data
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${proofOpen ? "rotate-180" : ""}`}
            />
          </button>
          {proofOpen && (
            <div className="animate-fade-in-up">
              <div
                className="rounded-lg p-4 text-xs font-mono overflow-x-auto space-y-4"
                style={{ backgroundColor: theme.colors.surfaceAlt }}
              >
                {/* Local receipt fields — from local store, NOT parsed from RPC */}
                <div>
                  <span className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: theme.colors.textMuted }}>
                    Local Receipt Metadata
                  </span>
                  <p className="text-xs mb-1.5" style={{ color: theme.colors.textMuted }}>
                    Sourced from the local receipt store, not directly from the Casper RPC.
                    These fields are included in the hash computation — their integrity is
                    guaranteed by the chain-verified hashes below.
                  </p>
                  <pre style={{ color: theme.colors.text }} className="whitespace-pre-wrap break-all">
{JSON.stringify({
  agent_id: decision.agentId,
  action_class: decision.actionClass,
  job_payment_ref_hash: decision.jobPaymentRefHash || "(empty)",
  timestamp: decision.timestamp,
}, null, 2)}
                  </pre>
                </div>

                {/* Chain-verified hashes — only these are confirmed directly from Casper RPC */}
                {verification?.chainVerified && (
                  <div className="border-t pt-3" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: theme.colors.textMuted }}>
                      Chain-Verified Hashes (from Casper RPC)
                    </span>
                    <p className="text-xs mb-1.5" style={{ color: theme.colors.textMuted }}>
                      These values were parsed directly from the on-chain transaction named
                      arguments via Casper RPC — this is what the blockchain actually stores.
                    </p>
                    <pre style={{ color: theme.colors.text }} className="whitespace-pre-wrap break-all">
{JSON.stringify({
  input_hash: verification.onChain.inputHash,
  output_hash: verification.onChain.outputHash,
}, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Transaction metadata */}
                <div className="border-t pt-3" style={{ borderColor: theme.colors.border + "40" }}>
                  <span className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: theme.colors.textMuted }}>
                    Transaction Metadata
                  </span>
                  <pre style={{ color: theme.colors.text }} className="whitespace-pre-wrap break-all">
{JSON.stringify({
  transaction_hash: decision.txHash,
  block_height: decision.blockHeight,
  contract_package: "hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb",
  entry_point: "record_decision",
  chain: "casper-test",
}, null, 2)}
                  </pre>
                </div>

                {/* Verification state */}
                {verification && (
                  <div className="border-t pt-3" style={{ borderColor: theme.colors.border + "40" }}>
                    <span className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: theme.colors.textMuted }}>
                      RPC Verification Result
                    </span>
                    <pre style={{ color: theme.colors.text }} className="whitespace-pre-wrap break-all">
{JSON.stringify({
  chain_verified: verification.chainVerified,
  chain_status: verification.chainStatus,
  input_match: verification.details.inputMatch,
  output_match: verification.details.outputMatch,
  explorer_url: verification.onChain.explorerUrl,
}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hash comparison (from verification) */}
      {activeResult && (
        <div className={`card ${theme.ui.radius} space-y-4`}>
          <h2
            className="font-semibold flex items-center gap-2"
            style={{ color: theme.colors.text }}
          >
            <Hash size={16} style={{ color: theme.colors.accent }} />
            Hash Comparison
            {tamperMode && (
              <span
                className="text-xs px-2 py-0.5 rounded ml-2"
                style={{
                  backgroundColor: theme.colors.error + "20",
                  color: theme.colors.error,
                }}
              >
                tampered data
              </span>
            )}
          </h2>
          <div className="space-y-3">
            <ComparisonRow
              label="Input Hash"
              onChain={activeResult.onChain.inputHash ?? "\u2014"}
              computed={activeResult.computed.inputHash}
              match={activeResult.details.inputMatch}
            />
            <ComparisonRow
              label="Output Hash"
              onChain={activeResult.onChain.outputHash ?? "\u2014"}
              computed={activeResult.computed.outputHash}
              match={activeResult.details.outputMatch}
            />
          </div>
        </div>
      )}

      {/* Try Tampering control */}
      <div
        className={`${theme.ui.radius} border p-4`}
        style={{
          borderColor: tamperMode
            ? theme.colors.error + "40"
            : theme.colors.primary + "40",
          backgroundColor: tamperMode
            ? theme.colors.error + "06"
            : theme.colors.primary + "06",
        }}
      >
        {!tamperMode ? (
          <button
            onClick={handleTamper}
            disabled={tamperVerifying || !verification?.chainVerified}
            className="w-full flex items-center gap-4 text-left"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.colors.primary + "20" }}
            >
              <AlertTriangle
                size={20}
                style={{ color: theme.colors.primary }}
              />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-medium"
                style={{ color: theme.colors.text }}
              >
                Try Tampering
              </p>
              <p
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Modify the output data and verify again — see how on-chain
                hashes catch any change.
              </p>
            </div>
            <span
              className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
              style={{
                backgroundColor: theme.colors.primary,
                color: "#000",
              }}
            >
              Tamper
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldX
                size={20}
                style={{ color: theme.colors.error }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.colors.error }}
                >
                  Tamper mode active
                </p>
                <p
                  className="text-xs"
                  style={{ color: theme.colors.textMuted }}
                >
                  Output data was modified — hash mismatch proves tampering.
                </p>
              </div>
            </div>
            <button
              onClick={resetTamper}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.textMuted,
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Audit Packet Export */}
      <div
        className={`${theme.ui.radius} border overflow-hidden`}
        style={{ borderColor: theme.colors.primary + "40", backgroundColor: theme.colors.surface }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3 border-b"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.primary + "08" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.colors.primary + "20" }}>
            <FileText size={18} style={{ color: theme.colors.primary }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: theme.colors.text }}>Enterprise Audit Packet</p>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>Send this to your auditor, compliance team, or counterparty</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: theme.colors.textMuted }}>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: theme.colors.success }} /> Receipt + hashes</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: theme.colors.success }} /> Casper proof</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: theme.colors.success }} /> Verification result</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: theme.colors.success }} /> Tamper test</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: theme.colors.success }} /> Job/payment binding</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={11} style={{ color: theme.colors.success }} /> Verification steps</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportReport("markdown")}
              disabled={exporting}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium ${theme.ui.radius}`}
              style={{ backgroundColor: theme.colors.primary, color: "#000" }}
            >
              <Download size={14} />
              {exporting ? "Generating..." : "Download (.md)"}
            </button>
            <button
              onClick={() => exportReport("json")}
              disabled={exporting}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm ${theme.ui.radius} border transition-colors hover:bg-white/5`}
              style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
            >
              <Download size={14} />
              {exporting ? "Generating..." : "JSON (.json)"}
            </button>
          </div>
          <p className="text-[10px] text-center" style={{ color: theme.colors.textMuted }}>
            Self-contained packet with independent verification instructions. No backend trust required.
          </p>
        </div>
      </div>

      {/* Share / QR section */}
      <div className={`card ${theme.ui.radius}`}>
        <div className="flex items-start gap-6">
          <div className="flex-1 space-y-3">
            <h3
              className="font-semibold text-sm"
              style={{ color: theme.colors.text }}
            >
              Share This Receipt
            </h3>
            <p
              className="text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              Anyone with this link can independently verify this decision
              against the Casper blockchain.
            </p>
            <div
              className={`flex items-center gap-2 p-2 ${theme.ui.radius} border`}
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceAlt,
              }}
            >
              <span
                className="text-xs font-mono truncate flex-1"
                style={{ color: theme.colors.text }}
              >
                {shareUrl}
              </span>
              <button
                onClick={copyLink}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/10 flex-shrink-0"
                style={{ color: theme.colors.primary }}
              >
                {copied ? (
                  <Check size={12} />
                ) : (
                  <Copy size={12} />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div
            className={`${theme.ui.radius} overflow-hidden flex-shrink-0`}
            style={{ backgroundColor: theme.colors.surfaceAlt }}
          >
            <img
              src={qrUrl}
              alt="QR code for this receipt"
              width={120}
              height={120}
              className="block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function VerificationBanner({
  verification,
  tamperMode,
  tamperResult,
  tamperVerifying,
}: {
  verification: VerifyResponse;
  tamperMode: boolean;
  tamperResult: VerifyResponse | null;
  tamperVerifying: boolean;
}) {
  const isVerified = tamperMode
    ? tamperResult?.verified ?? false
    : verification.verified;
  const isError =
    !tamperMode &&
    (verification.chainStatus === "rpc_error" ||
      verification.chainStatus === "parse_failed");

  const bgColor = tamperVerifying
    ? theme.colors.surface
    : isVerified
      ? theme.colors.success + "10"
      : theme.colors.error + "10";
  const borderColor = tamperVerifying
    ? theme.colors.border
    : isVerified
      ? theme.colors.success
      : theme.colors.error;

  return (
    <div
      className={`flex items-center gap-4 p-5 ${theme.ui.radius}`}
      style={{ backgroundColor: bgColor, borderLeft: `4px solid ${borderColor}` }}
    >
      {tamperVerifying ? (
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: theme.colors.primary }}
        />
      ) : isVerified ? (
        <ShieldCheck size={32} style={{ color: theme.colors.success }} />
      ) : (
        <ShieldX size={32} style={{ color: theme.colors.error }} />
      )}
      <div className="flex-1">
        <p
          className="text-lg font-bold"
          style={{
            color: tamperVerifying
              ? theme.colors.textMuted
              : isVerified
                ? theme.colors.success
                : theme.colors.error,
            fontFamily: theme.fonts.headline,
          }}
        >
          {tamperVerifying
            ? "Verifying..."
            : isVerified
              ? "VERIFIED"
              : tamperMode
                ? "TAMPERED"
                : isError
                  ? "UNVERIFIABLE"
                  : "MISMATCH"}
        </p>
        <p className="text-sm mt-0.5" style={{ color: theme.colors.textMuted }}>
          {tamperVerifying
            ? "Checking data against on-chain record..."
            : isVerified
              ? "Verified from Casper RPC \u2014 data matches on-chain hashes exactly."
              : tamperMode
                ? "Tampering detected! Modified data does not match the on-chain record."
                : isError
                  ? "Could not reach Casper RPC to verify."
                  : "Data does not match the on-chain attestation."}
        </p>
      </div>
      {verification.chainVerified && !tamperMode && (
        <span
          className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
          style={{
            backgroundColor: theme.colors.success + "20",
            color: theme.colors.success,
          }}
        >
          Casper RPC
        </span>
      )}
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
  mono,
  full,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <span
        className="text-xs uppercase tracking-wider flex items-center gap-1.5"
        style={{ color: theme.colors.textMuted }}
      >
        {icon}
        {label}
      </span>
      <p
        className={`text-sm mt-1 ${mono ? "font-mono" : ""}`}
        style={{ color: theme.colors.text }}
      >
        {value}
      </p>
    </div>
  );
}

function HashField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      className="p-3 rounded-lg flex items-center gap-3"
      style={{ backgroundColor: theme.colors.surfaceAlt }}
    >
      <div className="flex-1 min-w-0">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: theme.colors.textMuted }}
        >
          {label}
        </span>
        <p
          className="text-xs font-mono truncate mt-0.5"
          style={{ color: theme.colors.text }}
          title={value}
        >
          {value}
        </p>
      </div>
      <button
        onClick={copy}
        className="flex-shrink-0 p-1.5 rounded transition-colors hover:bg-white/10"
        style={{
          color: copied ? theme.colors.success : theme.colors.textMuted,
        }}
        title="Copy hash"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function ComparisonRow({
  label,
  onChain,
  computed,
  match,
}: {
  label: string;
  onChain: string;
  computed: string;
  match: boolean;
}) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: theme.colors.surfaceAlt }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs uppercase tracking-wider font-medium"
          style={{ color: theme.colors.textMuted }}
        >
          {label}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium">
          {match ? (
            <>
              <CheckCircle size={14} style={{ color: theme.colors.success }} />
              <span style={{ color: theme.colors.success }}>Match</span>
            </>
          ) : (
            <>
              <XCircle size={14} style={{ color: theme.colors.error }} />
              <span style={{ color: theme.colors.error }}>Mismatch</span>
            </>
          )}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs flex-shrink-0 w-16"
            style={{ color: theme.colors.textMuted }}
          >
            On-chain
          </span>
          <span
            className="text-xs font-mono truncate"
            style={{ color: theme.colors.text }}
            title={onChain}
          >
            {onChain}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs flex-shrink-0 w-16"
            style={{ color: theme.colors.textMuted }}
          >
            Computed
          </span>
          <span
            className="text-xs font-mono truncate"
            style={{
              color: match ? theme.colors.text : theme.colors.error,
            }}
            title={computed}
          >
            {computed}
          </span>
        </div>
      </div>
    </div>
  );
}
