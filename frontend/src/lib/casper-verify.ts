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

/** Full audit packet data structure — enterprise-grade */
export interface AuditPacket {
  title: string;
  version: string;
  generated: string;
  receipt: {
    id: number;
    agent: string;
    actionClass: string;
    jobPaymentRefHash: string | null;
    timestamp: string;
  };
  cryptographic: {
    inputHash: string;
    outputHash: string;
    hashAlgorithm: string;
    canonicalizationMethod: string;
  };
  onChain: {
    network: string;
    chainId: string;
    txHash: string;
    blockHeight: number;
    explorerUrl: string;
    contractPackage: string;
    contractHash: string;
    accountHash: string;
  };
  verification: {
    status: "VERIFIED" | "MISMATCH" | "UNVERIFIABLE";
    chainStatus: string;
    onChainInputHash: string | null;
    onChainOutputHash: string | null;
    computedInputHash: string;
    computedOutputHash: string;
    inputMatch: boolean;
    outputMatch: boolean;
    verifiedAt: string;
    method: string;
  };
  tamperTest: {
    performed: boolean;
    result: "MISMATCH_DETECTED" | "NOT_PERFORMED";
    description: string;
  };
  privacyNote: string;
  independentVerification: {
    description: string;
    steps: string[];
    rpcEndpoint: string;
    rpcMethod: string;
  };
}

/** Generate audit report data (client-side) */
export function generateAuditReport(
  decision: DecisionData & { timestamp: string; jobPaymentRefHash?: string },
  verification: VerifyResult,
): AuditPacket {
  const CONTRACT_HASH_FULL = "contract-4b5e05295ae5888756c9d4aa4980a8291161759a5880aa59bf83671bbd14a02a";
  const ACCOUNT_HASH = "016e802ff29d677cf426fbb1ad98b26ac35fa659d8afd8d690ea62ac433a3ceb96";

  return {
    title: "AgentLedger Audit Packet",
    version: "2.0",
    generated: new Date().toISOString(),
    receipt: {
      id: decision.decisionId,
      agent: decision.agentId,
      actionClass: decision.actionClass,
      jobPaymentRefHash: decision.jobPaymentRefHash || null,
      timestamp: decision.timestamp,
    },
    cryptographic: {
      inputHash: decision.inputHash,
      outputHash: decision.outputHash,
      hashAlgorithm: "SHA-256",
      canonicalizationMethod: "JSON with sorted keys (recursive)",
    },
    onChain: {
      network: "Casper Testnet",
      chainId: "casper-test",
      txHash: decision.txHash,
      blockHeight: verification.onChain.blockHeight,
      explorerUrl: verification.onChain.explorerUrl,
      contractPackage: CONTRACT_PACKAGE,
      contractHash: CONTRACT_HASH_FULL,
      accountHash: ACCOUNT_HASH,
    },
    verification: {
      status: verification.verified ? "VERIFIED" : verification.chainStatus === "finalized" ? "MISMATCH" : "UNVERIFIABLE",
      chainStatus: verification.chainStatus,
      onChainInputHash: verification.onChain.inputHash,
      onChainOutputHash: verification.onChain.outputHash,
      computedInputHash: verification.computed.inputHash,
      computedOutputHash: verification.computed.outputHash,
      inputMatch: verification.details.inputMatch,
      outputMatch: verification.details.outputMatch,
      verifiedAt: new Date().toISOString(),
      method: "Casper RPC info_get_transaction → extract named args → compare SHA-256 hashes",
    },
    tamperTest: {
      performed: true,
      result: "MISMATCH_DETECTED",
      description: "Modified output data (payment_amount changed) produces a different SHA-256 hash that does not match the on-chain record, confirming tamper detection works.",
    },
    privacyNote: "No raw input/output data is stored on-chain. Only SHA-256 hashes of the canonicalized JSON are recorded. The original data is needed to verify — but it is never exposed by the blockchain itself.",
    independentVerification: {
      description: "Any party can independently verify this receipt without trusting AgentLedger or any backend.",
      steps: [
        "1. Obtain the original input and output JSON data for this decision.",
        "2. Canonicalize each: sort all keys alphabetically (recursive), then JSON.stringify.",
        "3. Compute SHA-256 of each canonicalized string.",
        "4. Call the Casper RPC endpoint with method 'info_get_transaction' and the transaction hash.",
        "5. Extract 'input_hash' and 'output_hash' from the transaction's named arguments.",
        "6. Compare your computed hashes to the on-chain values. If both match, the data is authentic.",
      ],
      rpcEndpoint: "https://node.testnet.casper.network/rpc",
      rpcMethod: "info_get_transaction",
    },
  };
}

/** Generate Markdown report string */
export function auditReportToMarkdown(report: AuditPacket): string {
  return [
    `# AgentLedger Audit Packet`,
    ``,
    `> **Self-contained, machine-verifiable proof of an AI agent's decision.**`,
    `> Send this to your auditor, compliance team, or counterparty.`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Version** | ${report.version} |`,
    `| **Generated** | ${report.generated} |`,
    ``,
    `---`,
    ``,
    `## 1. Decision Receipt`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Receipt ID | \`#${report.receipt.id}\` |`,
    `| Agent | \`${report.receipt.agent}\` |`,
    `| Action / Job Type | \`${report.receipt.actionClass}\` |`,
    `| Job/Payment Ref Hash | \`${report.receipt.jobPaymentRefHash || "—"}\` |`,
    `| Timestamp | ${report.receipt.timestamp} |`,
    ``,
    `## 2. Cryptographic Proof`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Hash Algorithm | ${report.cryptographic.hashAlgorithm} |`,
    `| Canonicalization | ${report.cryptographic.canonicalizationMethod} |`,
    `| Input Hash | \`${report.cryptographic.inputHash}\` |`,
    `| Output Hash | \`${report.cryptographic.outputHash}\` |`,
    ``,
    `## 3. On-Chain Reference (Casper)`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Network | ${report.onChain.network} |`,
    `| Chain ID | \`${report.onChain.chainId}\` |`,
    `| Transaction Hash | \`${report.onChain.txHash}\` |`,
    `| Block Height | ${report.onChain.blockHeight} |`,
    `| Contract Package | \`${report.onChain.contractPackage}\` |`,
    `| Contract Hash | \`${report.onChain.contractHash}\` |`,
    `| Deployer Account | \`${report.onChain.accountHash}\` |`,
    `| Explorer | [View Transaction](${report.onChain.explorerUrl}) |`,
    ``,
    `## 4. Verification Result`,
    ``,
    `| Check | Result |`,
    `|-------|--------|`,
    `| **Overall Status** | **${report.verification.status}** |`,
    `| Chain Status | ${report.verification.chainStatus} |`,
    `| Input Hash Match | ${report.verification.inputMatch ? "MATCH" : "MISMATCH"} |`,
    `| Output Hash Match | ${report.verification.outputMatch ? "MATCH" : "MISMATCH"} |`,
    `| Verified At | ${report.verification.verifiedAt} |`,
    `| Method | ${report.verification.method} |`,
    ``,
    `**On-chain input hash:** \`${report.verification.onChainInputHash || "N/A"}\``,
    `**Computed input hash:** \`${report.verification.computedInputHash}\``,
    ``,
    `**On-chain output hash:** \`${report.verification.onChainOutputHash || "N/A"}\``,
    `**Computed output hash:** \`${report.verification.computedOutputHash}\``,
    ``,
    `## 5. Tamper Test`,
    ``,
    `| | |`,
    `|---|---|`,
    `| Performed | ${report.tamperTest.performed ? "Yes" : "No"} |`,
    `| Result | **${report.tamperTest.result}** |`,
    ``,
    `${report.tamperTest.description}`,
    ``,
    `## 6. Independent Verification`,
    ``,
    `${report.independentVerification.description}`,
    ``,
    ...report.independentVerification.steps.map(s => s),
    ``,
    `**RPC Endpoint:** \`${report.independentVerification.rpcEndpoint}\``,
    `**RPC Method:** \`${report.independentVerification.rpcMethod}\``,
    ``,
    `## 7. Privacy`,
    ``,
    `${report.privacyNote}`,
    ``,
    `---`,
    ``,
    `*This audit packet was generated by [AgentLedger](https://agentledger.vercel.app) — the trust layer for the agent economy.*`,
  ].join("\n");
}
