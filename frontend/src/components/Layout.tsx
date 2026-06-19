import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { theme } from "../theme.config";
import WalletButton from "./WalletButton";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const sidebarStyle = { backgroundColor: theme.colors.background, borderColor: theme.colors.border };
  const activeStyle = { backgroundColor: theme.colors.surface, color: theme.colors.text };
  const inactiveStyle = { color: theme.colors.textMuted };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-60 flex-col fixed inset-y-0 border-r" style={sidebarStyle}>
        <div className="p-5 border-b" style={{ borderColor: theme.colors.border }}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: theme.colors.primary }}>
              {theme.name[0]}
            </div>
            <span className="font-semibold" style={{ color: theme.colors.text }}>{theme.name}</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {theme.navLinks.map((link) => (
            <Link key={link.path} to={link.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors`}
              style={isActive(link.path) ? activeStyle : inactiveStyle}>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-60 border-r z-50" style={sidebarStyle}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border }}>
              <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: theme.colors.primary }}>
                  {theme.name[0]}
                </div>
                <span className="font-semibold" style={{ color: theme.colors.text }}>{theme.name}</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} style={{ color: theme.colors.textMuted }}><X size={20} /></button>
            </div>
            <nav className="p-3 space-y-1">
              {theme.navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={isActive(link.path) ? activeStyle : inactiveStyle}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60">
        <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ backgroundColor: theme.colors.background + "cc", borderColor: theme.colors.border }}>
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <button className="md:hidden" style={{ color: theme.colors.textMuted }} onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="hidden md:block" />
            <div className="flex items-center gap-3">
              {theme.features.showWallet && <WalletButton />}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
