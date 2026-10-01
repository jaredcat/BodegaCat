export const prerender = false;

import type { APIRoute } from "astro";
import { getCloudflareRuntime } from "@runtime/cloudflare";

function requestedKey(param: string | undefined): string | null {
  if (!param) return null;
  const key = param.split("/").filter(Boolean).join("/");
  if (!key.startsWith("theme/") || key.includes("..")) return null;
  return key;
}

export const GET: APIRoute = async ({ params }) => {
  const key = requestedKey(params.key);
  if (!key) return new Response(null, { status: 404 });

  const runtime = getCloudflareRuntime();
  if (!runtime.files.available) return new Response(null, { status: 404 });

  const file = await runtime.files.get(key);
  if (!file) return new Response(null, { status: 404 });

  return new Response(file.body, {
    headers: {
      "content-type": file.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=60",
    },
  });
};
