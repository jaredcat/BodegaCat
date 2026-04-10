import { useState } from "react";

export interface PreviewProductContext {
  readonly id: string;
  /** True when this product is still a storefront draft (`bodegacat_published` false). */
  readonly draft: boolean;
}

interface StorefrontPreviewBannerProps {
  /** Public home (`/`) — leaves staff preview and opens the prerendered storefront. */
  readonly exitHref: string;
  /** When set on `/preview/shop/[slug]`, Publish can promote this draft to live. */
  readonly previewProduct?: PreviewProductContext | null;
}

export default function StorefrontPreviewBanner({
  exitHref,
  previewProduct,
}: Readonly<StorefrontPreviewBannerProps>) {
  const [busy, setBusy] = useState<"publish" | "discard" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = previewProduct?.draft === true;

  async function publish() {
    if (!previewProduct?.draft) return;
    setError(null);
    setBusy("publish");
    try {
      const res = await fetch("/api/admin/publish-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: previewProduct.id }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Publish failed");
      }
      window.location.href = "/";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  async function discard() {
    setError(null);
    setBusy("discard");
    try {
      await fetch("/api/admin/clear-storefront-preview", {
        method: "POST",
        credentials: "same-origin",
      });
      window.location.href = "/admin/products";
    } catch {
      setError("Could not leave preview");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="flex flex-col gap-2 border-b border-cyan-700 bg-cyan-600 px-4 py-2.5 text-center text-sm text-white shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-2 sm:text-left"
      role="status"
    >
      <div className="min-w-0 flex-1 sm:text-center">
        <span className="font-medium">Storefront preview</span>
        <span className="hidden sm:inline"> — </span>
        <span className="block sm:inline">
          showing unpublished products.
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {canPublish && (
          <button
            type="button"
            className="rounded border border-white/50 bg-white/15 px-3 py-1 text-sm font-medium text-white hover:bg-white/25 disabled:opacity-60"
            disabled={busy !== null}
            onClick={() => {
              void publish();
            }}
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        )}
        <button
          type="button"
          className="rounded border border-white/50 bg-white/15 px-3 py-1 text-sm font-medium text-white hover:bg-white/25 disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => {
            void discard();
          }}
        >
          {busy === "discard" ? "Leaving…" : "Discard"}
        </button>
        <a
          href={exitHref}
          className="rounded border border-transparent px-2 py-1 text-sm underline decoration-white/80 hover:decoration-white"
        >
          Exit preview
        </a>
      </div>
      {error !== null && (
        <p className="w-full text-center text-xs text-red-100 sm:order-last">
          {error}
        </p>
      )}
    </div>
  );
}
