import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Stats } from "../lib/types";
import { theme, densityMap } from "../theme.config";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function StatCard({ stat, index }: { stat: Stats; index: number }) {
  const count = useCountUp(stat.value);
  const density = densityMap[theme.ui.density];
  const isPositive = (stat.change ?? 0) >= 0;

  return (
    <div
      className={`card glow-top ${theme.ui.radius} ${density.card} animate-slide-up`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
        {stat.label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold mt-2 animate-count-up font-mono" style={{ color: theme.colors.text }}>
        {stat.prefix}
        {count.toLocaleString()}
        {stat.suffix}
      </p>
      {stat.change !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? "+" : ""}
          {stat.change}%
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  const density = densityMap[theme.ui.density];
  return (
    <div className={`card ${theme.ui.radius} ${density.card}`}>
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-8 w-28 mb-2" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

export default function StatCards({
  stats,
  loading = false,
}: {
  stats: Stats[];
  loading?: boolean;
}) {
  const density = densityMap[theme.ui.density];

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${density.gap}`}>
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${density.gap}`}>
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  );
}
