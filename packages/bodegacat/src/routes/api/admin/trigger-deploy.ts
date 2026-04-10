import { triggerProductionDeployHook } from "@lib/deploy-hook";
import type { APIRoute } from "astro";

export const prerender = false;

/** Staff-only: queues a full production build (same as Pages deploy hook from Stripe). */
export const POST: APIRoute = async () => {
  const result = await triggerProductionDeployHook("admin_manual", {
    source: "POST /api/admin/trigger-deploy",
  });

  if (result.skipped) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Deploy isn’t available for this site yet.",
        learnMore:
          "https://github.com/jaredcat/BodegaCat/blob/main/examples/deploy/cloudflare-pages/README.md",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!result.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Deploy hook failed (${String(result.status)})`,
        detail: result.detail,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
