export const prerender = false;

import type { APIRoute } from "astro";
import { getCloudflareRuntime } from "@runtime/cloudflare";

export const GET: APIRoute = async () => {
  const runtime = getCloudflareRuntime();
  const settings = await runtime.settings.get();
  return new Response(JSON.stringify(settings), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const runtime = getCloudflareRuntime();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof body !== "object" || body === null) {
    return new Response(JSON.stringify({ error: "Body must be an object" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { stripe: _stripe, ...safeSettings } = body as Record<string, unknown>;

  await runtime.settings.save(safeSettings);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
