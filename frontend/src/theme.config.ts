/**
 * AgentLedger Theme Configuration
 * House mode: protocol (infrastructure + devtools)
 * Brand: Teal/emerald — trust, auditability, transparency
 */

const PRESETS = {
  protocol: {
    colors: {
      primary: "#2dd4bf",
      primaryHover: "#14b8a6",
      background: "#0a0e14",
      surface: "#111820",
      surfaceAlt: "#1a2330",
      border: "#1e2d3d",
      text: "#e2e8f0",
      textMuted: "#64748b",
      accent: "#2dd4bf",
      error: "#ef4444",
      success: "#2dd4bf",
      warning: "#f59e0b",
    },
    fonts: {
      sans: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
      headline: "'Space Grotesk', system-ui, sans-serif",
    },
    radius: "rounded-lg" as const,
    density: "compact" as const,
  },
} as const;

const MODE = "protocol" as keyof typeof PRESETS;
const preset = PRESETS[MODE];

export const theme = {
  name: "AgentLedger",
  tagline: "The flight recorder for the agent economy",

  mode: MODE,

  features: {
    showStats: true,
    showGrid: true,
    showHero: true,
    showWallet: false,
    showProofSection: true,
  },

  ui: {
    radius: preset.radius,
    density: preset.density,
  },

  colors: { ...preset.colors },
  fonts: { ...preset.fonts },

  navLinks: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Workbench", path: "/workbench" },
    { label: "Verify", path: "/verify" },
    { label: "Record", path: "/record" },
    { label: "Docs", path: "/about" },
  ],
};

export const densityMap = {
  compact: { card: "p-3", section: "py-4", gap: "gap-3" },
  comfortable: { card: "p-5", section: "py-8", gap: "gap-5" },
  spacious: { card: "p-8", section: "py-12", gap: "gap-8" },
} as const;

export type Theme = typeof theme;
