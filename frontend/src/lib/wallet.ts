import { useState, useCallback } from "react";

/**
 * Wallet connect hook — Aurora MUST replace this with a real adapter.
 *
 * For Solana: @solana/wallet-adapter-react
 * For EVM: wagmi + viem
 *
 * The starter stub detector in enforce_phase.py will BLOCK verification
 * if this stub is still in use. Replace before advancing.
 */
export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    // Aurora: replace this entire function with real wallet connection.
    // Example for Solana:
    //   const wallet = await window.solana?.connect();
    //   setAddress(wallet.publicKey.toString());
    //
    // This stub will be caught by the starter stub detector.
    throw new Error("Wallet not configured — replace useWallet() with a real adapter");
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
  }, []);

  return { connected, address, connecting, connect, disconnect };
}
