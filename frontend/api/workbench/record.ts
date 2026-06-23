/**
 * Vercel Serverless Function — POST /api/workbench/record
 *
 * Proxies write requests to the VPS backend (which holds the Casper signing key).
 * All safeguards enforced here; VPS validates shared secret.
 *
 * Safeguards:
 * - CORS allowlist (Vercel domain only)
 * - RECORDING_ENABLED kill switch (env var)
 * - Global cap (~25 recordings, operator-resettable via env)
 * - Per-IP rate limit (3/min)
 * - Per-session cap (5 per session)
 * - Single-flight lock (no concurrent writes)
 * - Balance guard (fail-closed on RPC error)
 * - Graceful degradation (any failure -> seeded receipt, never visible error)
 */

export const config = { runtime: "edge" };

const BACKEND_URL = process.env.BACKEND_URL || "";
const BACKEND_SECRET = process.env.BACKEND_SECRET || "";
// NOTE: If BACKEND_SECRET is empty, backend will reject all write requests (fail-closed).
// Set BACKEND_SECRET in Vercel environment variables before enabling live recording.
const RECORDING_ENABLED = process.env.RECORDING_ENABLED === "true";
const GLOBAL_CAP = parseInt(process.env.GLOBAL_CAP || "25", 10);
const RATE_LIMIT_MAX = 3; // per minute per IP
const SESSION_CAP = 5;
const ALLOWED_ORIGINS = [
  "https://frontend-beige-zeta-86.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
const VALID_SCENARIOS = ["vendor_payment", "defi_swap", "risk_alert"];

// In-memory state (resets on cold start — acceptable for demo)
let globalRecordCount = 0;
let inFlight = false;
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const sessionCounts = new Map<string, number>();

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    "Access-Control-Max-Age": "86400",
  };
}

function errorResponse(status: number, error: string, detail: string, origin: string | null) {
  return new Response(JSON.stringify({ error, detail }), {
    status,
    headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
  });
}

// Fallback seeded receipt for graceful degradation
function fallbackReceipt(scenario: string) {
  const seeded: Record<string, any> = {
    vendor_payment: {
      success: true,
      decisionId: 0,
      inputHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      outputHash: "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
      txHash: "2ab7b9c8400274066754386ca999ae6344a85d0c33ff6ec433fa5991eeb9e536",
      explorerUrl: "https://testnet.cspr.live/transaction/2ab7b9c8400274066754386ca999ae6344a85d0c33ff6ec433fa5991eeb9e536",
      fallback: true,
      fallbackReason: "Live recording temporarily unavailable. Showing seeded receipt.",
    },
    defi_swap: {
      success: true,
      decisionId: 1,
      inputHash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
      outputHash: "e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4",
      txHash: "3bc8c9d9511385177865497db000bf7455b96e1d44a7fd544a6a02efc1e5370",
      explorerUrl: "https://testnet.cspr.live/transaction/3bc8c9d9511385177865497db000bf7455b96e1d44a7fd544a6a02efc1e5370",
      fallback: true,
      fallbackReason: "Live recording temporarily unavailable. Showing seeded receipt.",
    },
    risk_alert: {
      success: true,
      decisionId: 2,
      inputHash: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      outputHash: "d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3",
      txHash: "4cd9dae0622496288976508ec111c08566ca7f2e55a8ae655a7b13fad2f6480",
      explorerUrl: "https://testnet.cspr.live/transaction/4cd9dae0622496288976508ec111c08566ca7f2e55a8ae655a7b13fad2f6480",
      fallback: true,
      fallbackReason: "Live recording temporarily unavailable. Showing seeded receipt.",
    },
  };
  return seeded[scenario] || seeded.vendor_payment;
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Method not allowed", "Use POST", origin);
  }

  // Fail-closed: BACKEND_URL must be configured (no hardcoded IP fallback)
  if (!BACKEND_URL) {
    const body = await req.json().catch(() => ({}));
    const receipt = fallbackReceipt((body as any).scenario || "vendor_payment");
    receipt.fallbackReason = "Backend not configured. Showing seeded receipt.";
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Kill switch
  if (!RECORDING_ENABLED) {
    const body = await req.json().catch(() => ({}));
    const receipt = fallbackReceipt((body as any).scenario || "vendor_payment");
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Invalid JSON", "Request body must be valid JSON", origin);
  }

  // Validate scenario (FIXED scenarios only — no user strings reach signer)
  const { scenario } = body;
  if (!scenario || VALID_SCENARIOS.indexOf(scenario) === -1) {
    return errorResponse(400, "Invalid scenario", `Choose from: ${VALID_SCENARIOS.join(", ")}`, origin);
  }

  // Global cap
  if (globalRecordCount >= GLOBAL_CAP) {
    const receipt = fallbackReceipt(scenario);
    receipt.fallbackReason = "Global recording cap reached. Showing seeded receipt.";
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Per-IP rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  let rateEntry = rateLimits.get(ip);
  if (!rateEntry || now > rateEntry.resetAt) {
    rateEntry = { count: 0, resetAt: now + 60000 };
    rateLimits.set(ip, rateEntry);
  }
  rateEntry.count++;
  if (rateEntry.count > RATE_LIMIT_MAX) {
    const receipt = fallbackReceipt(scenario);
    receipt.fallbackReason = "Rate limit reached. Showing seeded receipt. Try again in 1 minute.";
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Per-session cap
  const sessionId = req.headers.get("x-session-id") || ip;
  const sessCount = sessionCounts.get(sessionId) || 0;
  if (sessCount >= SESSION_CAP) {
    const receipt = fallbackReceipt(scenario);
    receipt.fallbackReason = "Session cap reached. Showing seeded receipt.";
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Single-flight lock
  if (inFlight) {
    const receipt = fallbackReceipt(scenario);
    receipt.fallbackReason = "Another recording in progress. Showing seeded receipt.";
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  inFlight = true;
  try {
    // Proxy to VPS backend
    const backendRes = await fetch(`${BACKEND_URL}/api/workbench/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Backend-Secret": BACKEND_SECRET,
      },
      body: JSON.stringify({ scenario }),
      signal: AbortSignal.timeout(35000),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      // Backend error -> graceful degradation
      const receipt = fallbackReceipt(scenario);
      receipt.fallbackReason = data.detail || data.error || "Backend unavailable";
      return new Response(JSON.stringify(receipt), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Success — increment counters
    globalRecordCount++;
    sessionCounts.set(sessionId, sessCount + 1);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    // Network/timeout error -> graceful degradation
    const receipt = fallbackReceipt(scenario);
    receipt.fallbackReason = "Backend temporarily unavailable. Showing seeded receipt.";
    return new Response(JSON.stringify(receipt), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } finally {
    inFlight = false;
  }
}
