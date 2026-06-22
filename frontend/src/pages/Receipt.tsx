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

      {/* On-chain reference */}
      <div className={`card ${theme.ui.radius} space-y-4`}>
        <h2
          className="font-semibold flex items-center gap-2"
          style={{ color: theme.colors.text }}
        >
          <Box size={16} style={{ color: theme.colors.accent }} />
          On-Chain Reference
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: theme.colors.textMuted }}
            >
              Transaction Hash
            </span>
            <p
              className="text-xs font-mono mt-1 break-all"
              style={{ color: theme.colors.text }}
            >
              {decision.txHash}
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
              #{decision.blockHeight || (verification?.onChain.blockHeight ?? "pending")}
            </p>
          </div>
        </div>
        <a
          href={`https://testnet.cspr.live/transaction/${decision.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm rounded-lg border transition-colors hover:bg-white/5"
          style={{
            borderColor: theme.colors.primary,
            color: theme.colors.primary,
          }}
        >
          <ExternalLink size={14} /> View on Casper Explorer
        </a>
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
