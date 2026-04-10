import { useState } from "react";

export default function DeployLiveSiteButton() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function deploy() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/trigger-deploy", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(
          body.error ??
            (body.detail ? `Deploy hook failed: ${body.detail}` : "Deploy hook failed"),
        );
        return;
      }
      setStatus("success");
      setMessage(
        "Deploy started. The live storefront will update when the build finishes (usually a few minutes).",
      );
    } catch (e: unknown) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Runs your Cloudflare <strong>BUILD_HOOK_URL</strong> (same as a git push).
        Stripe webhooks do <strong>not</strong> auto-deploy unless{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">
          STRIPE_WEBHOOK_AUTO_DEPLOY=true
        </code>{" "}
        is set — so you can batch edits in preview, then deploy once here. If
        you enabled build-time KV fetch, the deploy will also bake your Admin
        “Store Settings” into the public static pages.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={status === "loading"}
          onClick={() => {
            void deploy();
          }}
        >
          {status === "loading" ? "Starting deploy…" : "Deploy live site"}
        </button>
        {status === "success" && (
          <span className="text-sm font-medium text-green-700">Queued</span>
        )}
        {status === "error" && (
          <span className="text-sm font-medium text-red-700">Failed</span>
        )}
      </div>
      {message !== null && (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-700" : "text-gray-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
