export const prerender = false;

import { getCloudflareRuntime } from "@runtime/cloudflare";
import type { APIRoute } from "astro";

function requestedKey(parameter: string | undefined): string | undefined {
  if (!parameter) return undefined;
  const key = parameter.split("/").filter(Boolean).join("/");
  return !key.startsWith("theme/") || key.includes("..") ? undefined : key;
}

export const GET: APIRoute = async ({ params }) => {
  const key = requestedKey(params.key);
  if (!key) return new Response(undefined, { status: 404 });

  const runtime = getCloudflareRuntime();
  if (!runtime.files.available) return new Response(undefined, { status: 404 });

  const file = await runtime.files.get(key);
  if (!file) return new Response(undefined, { status: 404 });

  return new Response(file.body, {
    headers: {
      "content-type": file.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=60",
    },
  });
};
