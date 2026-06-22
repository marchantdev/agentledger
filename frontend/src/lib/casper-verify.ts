/**
 * Client-side Casper RPC verification.
 * Calls the Casper testnet RPC via a thin Vercel Edge proxy (/api/rpc)
 * to avoid CORS issues with node.testnet.casper.network.
 */

const RPC_PROXY = "/api/rpc";
const CONTRACT_PACKAGE = "hash-f8f8e34c914d463b0036cdeb80544e590d934e18f9cd3f749c74e5ac79c299bb";

/** Sort keys alphabetically and JSON.stringify — matches backend canonicalize() */
export function canonicalize(obj: Record<string, any>): string {
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(obj).sort()) {
    const v = obj[key];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      sorted[key] = JSON.parse(canonicalize(v));
    } else {
      sorted[key] = v;
    }
  }
  return JSON.stringify(sorted);
}

/** SHA-256 hash using Web Crypto API */
export async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Call Casper RPC via proxy */
async function rpcCall(method: string, params: Record<string, any>): Promise<any> {
  const res = await fetch(RPC_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RPC proxy error: ${res.status}`);
  return res.json();
}

export interface VerifyResult {
  verified: boolean;
  chainVerified: boolean;
  chainStatus: "finalized" | "not_found" | "pending" | "rpc_error" | "parse_failed" | "unknown";
  decisionId: number;
  onChain: {
    inputHash: string | null;
    outputHash: string | null;
    txHash: string;
    blockHeight: number;
    agentId: string;
    actionClass: string;
    explorerUrl: string;
  };
  computed: {
    inputHash: string;
    outputHash: string;
  };
  details: {
    inputMatch: boolean;
    outputMatch: boolean;
    rpcParseError?: string;
  };
}

export interface DecisionData {
  decisionId: number;
  agentId: string;
  actionClass: string;
  txHash: string;
  blockHeight: number;
  inputHash: string;
  outputHash: string;
}

/**
 * Verify a decision's integrity against the on-chain Casper transaction.
 * Runs entirely client-side (via RPC proxy for CORS).
 */
export async function verifyDecision(
  decision: DecisionData,
  inputData: Record<string, any>,
  outputData: Record<string, any>,
): Promise<VerifyResult> {
  const computedInputHash = await sha256(canonicalize(inputData));
  const computedOutputHash = await sha256(canonicalize(outputData));

  let chainStatus: VerifyResult["chainStatus"] = "unknown";
  let chainVerified = false;
  let onChainInputHash: string | null = null;
  let onChainOutputHash: string | null = null;
  let rpcParseError: string | undefined;
  let blockHeight = decision.blockHeight;

  try {
    const rpcJson = await rpcCall("info_get_transaction", {
      transaction_hash: { Version1: decision.txHash },
      finalized_approvals: false,
    });

    if (rpcJson.result?.transaction) {
      const v1 = rpcJson.result.transaction.Version1;
      const namedArgs = v1?.payload?.fields?.args?.Named || v1?.body?.args || null;

      if (Array.isArray(namedArgs)) {
        for (const [argName, argValue] of namedArgs) {
          if (argName === "input_hash") onChainInputHash = argValue?.parsed ?? null;
          else if (argName === "output_hash") onChainOutputHash = argValue?.parsed ?? null;
        }
      }

      if (rpcJson.result.execution_info?.block_height) {
        blockHeight = rpcJson.result.execution_info.block_height;
      }

      if (onChainInputHash !== null && onChainOutputHash !== null) {
        chainStatus = "finalized";
        chainVerified = true;
      } else {
        chainStatus = "parse_failed";
        rpcParseError = "Could not extract input_hash/output_hash from on-chain transaction args";
      }
    } else if (rpcJson.error) {
      chainStatus = "not_found";
      rpcParseError = rpcJson.error.message || "Transaction not found on-chain";
    } else {
      chainStatus = "pending";
    }
  } catch (err: any) {
    chainStatus = "rpc_error";
    rpcParseError = err.message;
  }

  const inputMatch = onChainInputHash !== null && computedInputHash === onChainInputHash;
  const outputMatch = onChainOutputHash !== null && computedOutputHash === onChainOutputHash;

  return {
    verified: inputMatch && outputMatch,
    chainVerified,
    chainStatus,
    decisionId: decision.decisionId,
    onChain: {
      inputHash: onChainInputHash,
      outputHash: onChainOutputHash,
      txHash: decision.txHash,
      blockHeight,
      agentId: decision.agentId,
      actionClass: decision.actionClass,
      explorerUrl: `https://testnet.cspr.live/transaction/${decision.txHash}`,
    },
    computed: { inputHash: computedInputHash, outputHash: computedOutputHash },
    details: {
      inputMatch,
      outputMatch,
      ...(rpcParseError && { rpcParseError }),
    },
  };
}

/** Generate audit report data (client-side) */
export function generateAuditReport(
  decision: DecisionData & { timestamp: string; jobPaymentRefHash?: string },
  verification: VerifyResult,
) {
  return {
    title: "AgentLedger — Audit-Ready Receipt Report",
    generated: new Date().toISOString(),
    receipt: {
      id: decision.decisionId,
      agent: decision.agentId,
      actionClass: decision.actionClass,
      jobPaymentRefHash: decision.jobPaymentRefHash || null,
      timestamp: decision.timestamp,
    },
    cryptographic: { inputHash: decision.inputHash, outputHash: decision.outputHash },
    onChain: {
      network: "Casper Testnet",
      txHash: decision.txHash,
      blockHeight: verification.onChain.blockHeight,
      explorerUrl: verification.onChain.explorerUrl,
      contractPackage: CONTRACT_PACKAGE,
    },
    verification: {
      status: verification.verified ? "VERIFIED" : verification.chainStatus === "finalized" ? "MISMATCH" : "UNVERIFIABLE",
      chainStatus: verification.chainStatus,
      onChainInputHash: verification.onChain.inputHash,
      onChainOutputHash: verification.onChain.outputHash,
      inputMatch: verification.details.inputMatch,
      outputMatch: verification.details.outputMatch,
    },
    privacyNote: "No raw prompt or output data is stored on-chain — hashes only.",
  };
}

/** Generate Markdown report string */
export function auditReportToMarkdown(report: ReturnType<typeof generateAuditReport>): string {
  return [
    `# AgentLedger — Audit-Ready Receipt Report`,
    ``, `**Generated:** ${report.generated}`,
    ``, `## Receipt #${report.receipt.id}`,
    ``, `| Field | Value |`, `|-------|-------|`,
    `| Agent | \`${report.receipt.agent}\` |`,
    `| Action / Job Type | \`${report.receipt.actionClass}\` |`,
    `| Job Payment Ref | \`${report.receipt.jobPaymentRefHash || "—"}\` |`,
    `| Timestamp | ${report.receipt.timestamp} |`,
    ``, `## Cryptographic Proof`,
    ``, `| Hash | Value |`, `|------|-------|`,
    `| Input Hash | \`${report.cryptographic.inputHash}\` |`,
    `| Output Hash | \`${report.cryptographic.outputHash}\` |`,
    ``, `## On-Chain Reference`,
    ``, `| Field | Value |`, `|-------|-------|`,
    `| Network | ${report.onChain.network} |`,
    `| Transaction Hash | \`${report.onChain.txHash}\` |`,
    `| Block Height | ${report.onChain.blockHeight} |`,
    `| Contract | \`${report.onChain.contractPackage}\` |`,
    `| Explorer | [View](${report.onChain.explorerUrl}) |`,
    ``, `## Verification`,
    ``, `| Check | Result |`, `|-------|--------|`,
    `| Status | **${report.verification.status}** |`,
    `| Input Hash Match | ${report.verification.inputMatch ? "Match" : "Mismatch"} |`,
    `| Output Hash Match | ${report.verification.outputMatch ? "Match" : "Mismatch"} |`,
    ``, `---`, `*Generated by [AgentLedger](https://github.com/marchantdev/agentledger)*`,
  ].join("\n");
}
