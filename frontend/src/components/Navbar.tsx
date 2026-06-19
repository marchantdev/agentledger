import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { theme } from "../theme.config";
import WalletButton from "./WalletButton";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
      style={{ backgroundColor: theme.colors.background + "cc", borderColor: theme.colors.border + "80" }}>
      <div className="section flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: theme.colors.primary }}>
            {theme.name[0]}
          </div>
          <span className="font-semibold text-lg" style={{ color: theme.colors.text }}>{theme.name}</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {theme.navLinks.map((link) => (
            <Link key={link.path} to={link.path} className="text-sm transition-colors hover:opacity-80"
              style={{ color: theme.colors.textMuted }}>{link.label}</Link>
          ))}
          <Link to="/dashboard" className="btn-primary text-sm">Launch App</Link>
          {theme.features.showWallet && <WalletButton />}
        </div>

        <button className="md:hidden" style={{ color: theme.colors.textMuted }}
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t animate-fade-in" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
          <div className="section py-4 space-y-3">
            {theme.navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)}
                className="block text-sm py-2" style={{ color: theme.colors.textMuted }}>{link.label}</Link>
            ))}
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block btn-primary text-sm text-center mt-2">Launch App</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
