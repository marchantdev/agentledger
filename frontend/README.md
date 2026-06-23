# Frontend Starter Template

Professional hackathon frontend scaffold. React 19 + Vite 6 + Tailwind 3.4 + TypeScript.

## Quick Start

```bash
# Copy to your hackathon workspace
cp -r templates/frontend-starter/ hackathons/{name}/frontend/
cd hackathons/{name}/frontend/

# Install and run
npm install
npm run dev
```

Open http://localhost:5173 — all 5 routes work immediately.

## Customization

Edit **one file**: `src/theme.config.ts`

- `name` / `tagline` — project identity
- `layout` — "dashboard" | "marketplace" | "landing-heavy"
- `features` — toggle showStats, showGrid, showHero, showWallet
- `ui.radius` — "rounded-2xl" | "rounded-md" | "rounded-none"
- `ui.density` — "compact" | "comfortable" | "spacious"
- `colors` — primary, surface, text colors (hex values)
- `navLinks` — sidebar/navbar navigation items

## Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Marketing page with hero, features, CTA |
| `/dashboard` | Dashboard | Stats, activity feed, status panel |
| `/explore` | Explore | Searchable/filterable grid of items |
| `/item/:id` | ItemDetail | Individual item view with metadata |
| `/about` | About | Project description, tech stack, links |

## Components

| Component | File | Usage |
|-----------|------|-------|
| `Layout` | `components/Layout.tsx` | Sidebar + header wrapper for app pages |
| `Navbar` | `components/Navbar.tsx` | Top nav for landing page |
| `Hero` | `components/Hero.tsx` | Landing hero with gradient, badge, CTAs |
| `StatCards` | `components/StatCards.tsx` | Animated metric cards with count-up |
| `DataGrid` | `components/DataGrid.tsx` | Searchable card grid with filters |
| `LoadingState` | `components/LoadingState.tsx` | Skeleton, spinner, loading dots |
| `WalletButton` | `components/WalletButton.tsx` | Wallet connect button stub |

## Connecting Real Data

1. Set `VITE_API_URL` in `.env` (e.g., `VITE_API_URL=http://localhost:3000`)
2. Replace `data.ts` imports with `api.ts` calls in page components
3. Update `src/lib/types.ts` with your real data types

## Deployment

```bash
# One-command deploy (requires VERCEL_TOKEN in env)
npm run deploy

# Manual
npm run build
npx vercel deploy --yes --prod
```

The deploy script writes the live URL to `deployment-url.txt` — required by the URL_LIVE gate.

## CSS Classes

Pre-built in `globals.css`:
- `.card` / `.card-hover` / `.card-glass` — card variants
- `.badge-primary` / `.badge-warning` / `.badge-error` / `.badge-info`
- `.btn-primary` / `.btn-secondary` / `.btn-outline`
- `.input` — styled input field
- `.section` — max-width content wrapper
- `.gradient-text` — gradient text effect
- `.glow-top` — subtle top-edge glow on cards
- `.skeleton` — skeleton loading placeholder
- `.animate-slide-up` / `.animate-fade-in-up` / `.animate-shimmer`
