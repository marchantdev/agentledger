import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { theme } from "../theme.config";

interface HeroProps {
  badge?: string;
  title: string;
  highlight?: string;
  subtitle: string;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
}

export default function Hero({
  badge, title, highlight, subtitle,
  primaryCta = { label: "Launch App", to: "/dashboard" },
  secondaryCta = { label: "Read Docs", to: "/about" },
}: HeroProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-15"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${theme.colors.primary}44 0%, transparent 70%)` }} />

      <div className="section relative pt-32 pb-20 md:pt-40 md:pb-28 text-center">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs mb-6 animate-fade-in-up"
            style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface + "80", color: theme.colors.textMuted }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: theme.colors.primary }} />
            {badge}
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up max-w-4xl mx-auto leading-[1.1]"
          style={{ color: theme.colors.text, fontFamily: (theme.fonts as any).headline || theme.fonts.sans }}>
          {title}
          {highlight && (<><br /><span className="gradient-text">{highlight}</span></>)}
        </h1>

        <p className="mt-6 text-base sm:text-lg max-w-2xl mx-auto animate-slide-up leading-relaxed"
          style={{ animationDelay: "0.1s", color: theme.colors.textMuted }}>
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-slide-up"
          style={{ animationDelay: "0.2s" }}>
          <Link to={primaryCta.to} className="btn-primary flex items-center gap-2 text-base px-8 py-3">
            {primaryCta.label} <ArrowRight size={18} />
          </Link>
          <Link to={secondaryCta.to} className="btn-outline flex items-center gap-2 text-base px-8 py-3">
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
