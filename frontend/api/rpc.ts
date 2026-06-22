/**
 * Vercel Serverless Function — thin Casper RPC proxy.
 * Forwards JSON-RPC requests to node.testnet.casper.network/rpc,
 * working around CORS restrictions for browser-based verification.
 * Only allows info_get_transaction and query_balance methods.
 */
export const config = { runtime: "edge" };

const CASPER_RPC = "https://node.testnet.casper.network/rpc";
const ALLOWED_METHODS = new Set(["info_get_transaction", "query_balance"]);

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.method || !ALLOWED_METHODS.has(body.method)) {
    return new Response(
      JSON.stringify({ error: `Method not allowed: ${body.method}` }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const rpcRes = await fetch(CASPER_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await rpcRes.text();
    return new Response(data, {
      status: rpcRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "RPC proxy error", detail: err.message }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }
}
