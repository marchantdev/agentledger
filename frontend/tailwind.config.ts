import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Fonts are set by theme.config.ts house modes, not here.
      // These are fallbacks only — the real fonts come from CSS variables + inline styles.
      fontFamily: {
        sans: ["var(--font-sans, 'DM Sans')", "system-ui", "sans-serif"],
        mono: ["var(--font-mono, 'JetBrains Mono')", "Consolas", "monospace"],
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out both",
        shimmer: "shimmer 1.5s infinite linear",
        "fade-in": "fade-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
