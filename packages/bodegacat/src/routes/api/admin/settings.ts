export const prerender = false;

import { getCloudflareRuntime } from "@runtime/cloudflare";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const runtime = getCloudflareRuntime();
  const settings = await runtime.settings.get();
  return Response.json(settings, {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const runtime = getCloudflareRuntime();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON" },
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // `typeof null === "object"` — reject null via falsiness after the typeof check.
  if (typeof body !== "object" || !body) {
    return Response.json(
      { error: "Body must be an object" },
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { stripe: _stripe, ...safeSettings } = body as Record<string, unknown>;

  await runtime.settings.save(safeSettings);

  return Response.json(
    { ok: true },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
