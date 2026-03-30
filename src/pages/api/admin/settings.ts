export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getStoredSettings, saveSettings } from '@lib/settings';

export const GET: APIRoute = async () => {
  const kv = env.SETTINGS_KV;
  const settings = await getStoredSettings(kv);
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const kv = env.SETTINGS_KV;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body !== 'object' || body === null) {
    return new Response(JSON.stringify({ error: 'Body must be an object' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Strip any attempt to override Stripe secrets via this endpoint
  const { stripe: _stripe, ...safeSettings } = body as Record<string, unknown>;

  await saveSettings(kv, safeSettings);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
