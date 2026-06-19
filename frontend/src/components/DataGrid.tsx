import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import type { Item } from "../lib/types";
import { theme, densityMap } from "../theme.config";

const STATUS_COLORS: Record<string, string> = {
  active: "badge-primary",
  pending: "badge-warning",
  completed: "badge-info",
  error: "badge-error",
};

interface DataGridProps {
  items: Item[];
  loading?: boolean;
  searchable?: boolean;
  categories?: string[];
}

export default function DataGrid({
  items,
  loading = false,
  searchable = true,
  categories,
}: DataGridProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allCategories =
    categories ?? [...new Set(items.map((item) => item.category))];

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const density = densityMap[theme.ui.density];

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${density.gap}`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`card ${theme.ui.radius} ${density.card}`}>
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-5 w-40 mb-2" />
            <div className="skeleton h-3 w-full mb-1" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + filter bar */}
      {searchable && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-current opacity-50"
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`btn text-xs whitespace-nowrap ${
                !activeCategory ? "btn-primary" : "btn-secondary"
              }`}
            >
              All
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className={`btn text-xs whitespace-nowrap ${
                  activeCategory === cat ? "btn-primary" : "btn-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-current opacity-50">
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${density.gap}`}>
          {filtered.map((item, i) => (
            <Link
              key={item.id}
              to={`/item/${item.id}`}
              className={`card-hover group ${theme.ui.radius} ${density.card} animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={STATUS_COLORS[item.status] ?? "badge"}>
                  {item.status}
                </span>
                <span className="text-xs text-current opacity-50">{item.category}</span>
              </div>
              <h3 className="font-semibold group-hover:opacity-100 transition-colors" style={{ color: theme.colors.text }}>
                {item.title}
              </h3>
              <p className="text-sm mt-1 line-clamp-2" style={{ color: theme.colors.textMuted }}>
                {item.description}
              </p>
              {item.metadata && (
                <div className="flex gap-3 mt-3 pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                  {Object.entries(item.metadata)
                    .slice(0, 3)
                    .map(([key, val]) => (
                      <div key={key} className="text-xs">
                        <span style={{ color: theme.colors.textMuted }}>{key}: </span>
                        <span className="font-medium font-mono" style={{ color: theme.colors.text }}>
                          {val}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-3 text-xs font-medium transition-colors" style={{ color: theme.colors.textMuted }}>
                View details
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
