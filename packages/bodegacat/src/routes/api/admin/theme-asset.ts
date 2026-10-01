export const prerender = false;

import type { APIRoute } from "astro";
import { getCloudflareRuntime } from "@runtime/cloudflare";

const MAX_BYTES = 5 * 1024 * 1024;

function fieldId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)) return null;
  return value;
}

export const POST: APIRoute = async ({ request }) => {
  const runtime = getCloudflareRuntime();
  if (!runtime.files.available) {
    return new Response(
      JSON.stringify({ error: "File storage is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Expected a file upload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const field = fieldId(form.get("field"));
  const file = form.get("file");
  if (!field || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Missing image" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "Use an image under 5 MB" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const key = `theme/${field}`;
  await runtime.files.put(key, await file.arrayBuffer(), file.type);
  return new Response(JSON.stringify({ url: `/files/${key}` }), {
    headers: { "Content-Type": "application/json" },
  });
};
