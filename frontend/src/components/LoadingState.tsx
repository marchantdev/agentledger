import { theme } from "../theme.config";

/** Full-page loading spinner */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${theme.colors.primary}40`, borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: theme.colors.textMuted }}>Loading...</p>
      </div>
    </div>
  );
}

/** Skeleton card — use in grids */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className={`card ${theme.ui.radius}`}>
      <div className="skeleton h-3 w-16 mb-3" />
      <div className="skeleton h-5 w-3/4 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 mb-2"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

/** Skeleton row — use in tables/lists */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b" style={{ borderColor: theme.colors.border }}>
      <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-1/2" />
      </div>
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
  );
}

/** Inline loading dots */
export function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
          style={{ backgroundColor: theme.colors.textMuted, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}
