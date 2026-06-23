/**
 * Vercel Serverless Function — catch-all proxy for backend read endpoints.
 * Routes: /api/backend/decisions, /api/backend/stats, /api/backend/verify, etc.
 * Frontend calls /api/backend/X which proxies to VPS backend /api/X.
 */

export const config = { runtime: "edge" };

const BACKEND_URL = process.env.BACKEND_URL || "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Only proxy these API paths (whitelist)
const ALLOWED_PATHS = [
  "/api/decisions",
  "/api/stats",
  "/api/verify",
  "/api/health",
  "/api/workbench/scenarios",
  "/api/workbench/limits",
];

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!BACKEND_URL) {
    return new Response(JSON.stringify({ error: "Backend not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const url = new URL(req.url);
  // Extract path after /api/backend/
  const backendPath = "/api/" + url.pathname.replace(/^\/api\/backend\/?/, "");

  // Whitelist check — only allow known API paths
  const pathBase = backendPath.split("?")[0];
  // Exact prefix match: path must equal an allowed path or extend it with / (e.g., /api/decisions/5)
  const isAllowed = ALLOWED_PATHS.some(p => pathBase === p || pathBase.startsWith(p + "/"));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}${backendPath}${url.search}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(req.method === "POST" ? { body: await req.text() } : {}),
      signal: AbortSignal.timeout(15000),
    });

    const data = await backendRes.text();
    return new Response(data, {
      status: backendRes.status,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=10",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Backend unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }
}
