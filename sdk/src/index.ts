import { createHash } from "crypto";
import { CasperClient, DeployUtil, Keys, CLPublicKey, RuntimeArgs, CLValueBuilder, CLString, CLU64 } from "casper-js-sdk";

/** Configuration for the AgentLedger SDK */
export interface AgentLedgerConfig {
  /** Contract hash on Casper (e.g., "hash-abc123...") */
  contractHash: string;
  /** Casper RPC URL (default: testnet) */
  rpcUrl?: string;
  /** Chain name (default: "casper-test") */
  chainName?: string;
  /** Path to the agent's secret key PEM file */
  secretKeyPath?: string;
  /** Pre-loaded key pair (alternative to secretKeyPath) */
  keyPair?: Keys.AsymmetricKey;
  /** Gas payment in motes (default: 3 CSPR = 3_000_000_000) */
  paymentAmount?: string;
}

/** Input for recording a decision */
export interface DecisionInput {
  /** Unique agent identifier */
  agentId: string;
  /** Classification of the action (e.g., "swap", "rebalance", "risk-alert") */
  actionClass: string;
  /** Raw input data — will be SHA-256 hashed */
  inputData: Record<string, unknown>;
  /** Raw output data — will be SHA-256 hashed */
  outputData: Record<string, unknown>;
}

/** Result of recording a decision */
export interface DecisionResult {
  /** Deploy hash on Casper */
  deployHash: string;
  /** SHA-256 hash of input data */
  inputHash: string;
  /** SHA-256 hash of output data */
  outputHash: string;
  /** Casper explorer URL for the deploy */
  explorerUrl: string;
}

/** A recorded decision read from the contract */
export interface DecisionRecord {
  decisionId: number;
  agentId: string;
  actionClass: string;
  inputHash: string;
  outputHash: string;
}

/** Compute SHA-256 hex digest of a JSON object */
export function hashData(data: Record<string, unknown>): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * AgentLedger SDK — record and verify AI agent decisions on Casper.
 *
 * Usage:
 * ```ts
 * const ledger = new AgentLedger({
 *   contractHash: "hash-...",
 *   secretKeyPath: "./keys/secret_key.pem",
 * });
 *
 * const result = await ledger.attest({
 *   agentId: "trading-agent-alpha",
 *   actionClass: "swap",
 *   inputData: { pair: "CSPR/USDT", amount: 1000 },
 *   outputData: { executed: true, price: 0.042 },
 * });
 * ```
 */
export class AgentLedger {
  private client: CasperClient;
  private contractHash: string;
  private chainName: string;
  private keyPair?: Keys.AsymmetricKey;
  private paymentAmount: string;
  private explorerBase: string;

  constructor(config: AgentLedgerConfig) {
    const rpcUrl = config.rpcUrl ?? "https://node.testnet.casper.network/rpc";
    this.client = new CasperClient(rpcUrl);
    this.contractHash = config.contractHash;
    this.chainName = config.chainName ?? "casper-test";
    this.paymentAmount = config.paymentAmount ?? "3000000000"; // 3 CSPR

    if (config.keyPair) {
      this.keyPair = config.keyPair;
    } else if (config.secretKeyPath) {
      this.keyPair = Keys.Ed25519.loadKeyPairFromPrivateFile(config.secretKeyPath);
    }

    this.explorerBase = this.chainName === "casper"
      ? "https://cspr.live/deploy/"
      : "https://testnet.cspr.live/deploy/";
  }

  /**
   * Record a decision on-chain.
   * Hashes the input/output data and calls record_decision on the contract.
   */
  async attest(decision: DecisionInput): Promise<DecisionResult> {
    if (!this.keyPair) {
      throw new Error("No key pair configured. Provide secretKeyPath or keyPair.");
    }

    const inputHash = hashData(decision.inputData);
    const outputHash = hashData(decision.outputData);

    const args = RuntimeArgs.fromMap({
      agent_id: CLValueBuilder.string(decision.agentId),
      action_class: CLValueBuilder.string(decision.actionClass),
      input_hash: CLValueBuilder.string(inputHash),
      output_hash: CLValueBuilder.string(outputHash),
    });

    const deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(
        this.keyPair.publicKey,
        this.chainName,
        1,
        1800000, // 30 min TTL
      ),
      DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        Uint8Array.from(Buffer.from(this.contractHash.replace("hash-", ""), "hex")),
        "record_decision",
        args,
      ),
      DeployUtil.standardPayment(this.paymentAmount),
    );

    const signedDeploy = DeployUtil.signDeploy(deploy, this.keyPair);
    const result = await this.client.putDeploy(signedDeploy);

    return {
      deployHash: result,
      inputHash,
      outputHash,
      explorerUrl: `${this.explorerBase}${result}`,
    };
  }

  /**
   * Hash data without sending to chain — useful for local verification.
   */
  hash(data: Record<string, unknown>): string {
    return hashData(data);
  }

  /**
   * Verify that a given data object matches an on-chain hash.
   */
  verify(data: Record<string, unknown>, expectedHash: string): boolean {
    return hashData(data) === expectedHash;
  }

  /**
   * Create a middleware/wrapper function for agent decision pipelines.
   * Automatically attests every decision before returning the result.
   */
  wrap<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>>(
    agentId: string,
    actionClass: string,
    fn: (input: TInput) => Promise<TOutput>,
  ): (input: TInput) => Promise<TOutput & { _attestation: DecisionResult }> {
    return async (input: TInput) => {
      const output = await fn(input);

      const attestation = await this.attest({
        agentId,
        actionClass,
        inputData: input,
        outputData: output,
      });

      return { ...output, _attestation: attestation };
    };
  }
}

export default AgentLedger;
