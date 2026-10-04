export const prerender = false;

import { getCloudflareRuntime } from "@runtime/cloudflare";
import type { APIRoute } from "astro";

const MAX_BYTES = 5 * 1024 * 1024;

function fieldId(value: FormDataEntryValue | undefined): string | undefined {
  return typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)
    ? undefined
    : value;
}

export const POST: APIRoute = async ({ request }) => {
  const runtime = getCloudflareRuntime();
  if (!runtime.files.available) {
    return Response.json(
      { error: "File storage is not configured" },
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected a file upload" },
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const field = fieldId(form.get("field") ?? undefined);
  const file = form.get("file");
  if (!field || !(file instanceof File)) {
    return Response.json(
      { error: "Missing image" },
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) {
    return Response.json(
      { error: "Use an image under 5 MB" },
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const key = `theme/${field}`;
  await runtime.files.put(key, await file.arrayBuffer(), file.type);
  return Response.json(
    { url: `/files/${key}` },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
