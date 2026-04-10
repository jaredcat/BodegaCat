import { BUILD_HOOK_URL } from "astro:env/server";

export type DeployHookResult =
  | { ok: true; skipped: true }
  | { ok: true; skipped: false }
  | { ok: false; skipped: false; status: number; detail?: string };

/**
 * POSTs to the Cloudflare Pages deploy hook (or CI URL) configured as `BUILD_HOOK_URL`.
 */
export async function triggerProductionDeployHook(
  reason: string,
  data: Record<string, unknown> = {},
): Promise<DeployHookResult> {
  if (!BUILD_HOOK_URL) {
    console.log(
      `[deploy-hook] BUILD_HOOK_URL not set — skipping (${reason})`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const response = await fetch(BUILD_HOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log(`[deploy-hook] Triggered (${reason})`);
      return { ok: true, skipped: false };
    }

    const detail = await response.text().catch(() => "");
    console.error(
      `[deploy-hook] Failed (${reason}):`,
      response.status,
      detail,
    );
    return {
      ok: false,
      skipped: false,
      status: response.status,
      detail: detail || undefined,
    };
  } catch (error) {
    console.error(`[deploy-hook] Error (${reason}):`, error);
    return {
      ok: false,
      skipped: false,
      status: 0,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
