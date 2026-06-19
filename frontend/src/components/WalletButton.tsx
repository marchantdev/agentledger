import { Wallet, LogOut } from "lucide-react";
import { useWallet } from "../lib/wallet";
import { LoadingDots } from "./LoadingState";
import { theme } from "../theme.config";

export default function WalletButton() {
  const { connected, address, connecting, connect, disconnect } = useWallet();

  if (connecting) {
    return (
      <button className="btn-secondary flex items-center gap-2 text-xs" disabled>
        <Wallet size={14} />
        Connecting <LoadingDots />
      </button>
    );
  }

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-2.5 py-1.5 rounded-lg" style={{ color: theme.colors.textMuted, backgroundColor: theme.colors.surface }}>
          {address}
        </span>
        <button
          onClick={disconnect}
          className="transition-colors p-1.5 hover:opacity-80" style={{ color: theme.colors.textMuted }}
          title="Disconnect"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="btn-outline flex items-center gap-2 text-xs"
    >
      <Wallet size={14} />
      Connect Wallet
    </button>
  );
}
