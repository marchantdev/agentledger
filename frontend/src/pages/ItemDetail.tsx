import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { PageLoader } from "../components/LoadingState";
import { theme, densityMap } from "../theme.config";
import type { Item } from "../lib/types";

/**
 * Item detail page — shows a single entity.
 *
 * Aurora: REPLACE the data fetching with real API calls.
 * DO NOT import from lib/data — starter stub detector will block.
 */

const STATUS_BADGE: Record<string, string> = {
  active: "badge-primary",
  pending: "badge-warning",
  completed: "badge-info",
};

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Aurora: replace with real API call
    // Example: api.getItem(id).then(setItem)
    async function fetchData() {
      try {
        // Replace with your actual data source:
        // const res = await fetch(`/api/items/${id}`);
        // setItem(await res.json());
        setError("Item detail not connected — wire your API in ItemDetail.tsx");
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <PageLoader />;

  const density = densityMap[theme.ui.density];

  return (
    <div className="max-w-3xl space-y-6 animate-slide-up">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
        style={{ color: theme.colors.textMuted }}
      >
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      {error && (
        <div
          className={`${theme.ui.radius} p-4 border flex items-start gap-3`}
          style={{ borderColor: theme.colors.warning + "40", backgroundColor: theme.colors.warning + "10" }}
        >
          <AlertCircle size={18} style={{ color: theme.colors.warning }} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium" style={{ color: theme.colors.warning }}>{error}</p>
            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
              Connect your backend API to load item details.
            </p>
          </div>
        </div>
      )}

      {item && (
        <>
          <div className={`card ${theme.ui.radius} ${density.card}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{item.title}</h1>
                <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{item.description}</p>
              </div>
              <span className={STATUS_BADGE[item.status] ?? "badge"}>{item.status}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t" style={{ borderColor: theme.colors.border }}>
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Category</p>
                <p className="text-sm font-medium mt-1" style={{ color: theme.colors.text }}>{item.category}</p>
              </div>
              {item.value !== undefined && (
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Value</p>
                  <p className="text-sm font-medium font-mono mt-1" style={{ color: theme.colors.text }}>${item.value.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>Created</p>
                <p className="text-sm font-medium mt-1" style={{ color: theme.colors.text }}>{item.createdAt}</p>
              </div>
            </div>
          </div>

          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className={`card ${theme.ui.radius} ${density.card}`}>
              <h2 className="font-semibold mb-4" style={{ color: theme.colors.text }}>Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item.metadata).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>{key}</p>
                    <p className="text-sm font-mono mt-1" style={{ color: theme.colors.text }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`card ${theme.ui.radius} ${density.card}`}>
            <h2 className="font-semibold mb-4" style={{ color: theme.colors.text }}>Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary flex items-center gap-2">
                <ExternalLink size={14} /> Open
              </button>
              <button className="btn-secondary">Edit</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
