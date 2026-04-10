import { useCallback, useState } from "react";
import type { ProductType } from "../types/product";
import VariationManager from "./VariationManager";

interface ProductTypesEditorProps {
  readonly initialProductTypes: ProductType[];
  readonly exampleDefaults: ProductType[];
  readonly canSave: boolean;
}

export default function ProductTypesEditor({
  initialProductTypes,
  exampleDefaults,
  canSave,
}: Readonly<ProductTypesEditorProps>) {
  const [types, setTypes] = useState<ProductType[]>(() =>
    structuredClone(initialProductTypes),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!canSave) return;
    setStatus("saving");
    setErrorMessage(null);
    try {
      const getRes = await fetch("/api/admin/settings");
      if (!getRes.ok) {
        throw new Error(`Failed to load settings (${String(getRes.status)})`);
      }
      const existing = (await getRes.json()) as Record<string, unknown>;
      const { stripe: _s, ...rest } = existing;
      const postRes = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, productTypes: types }),
      });
      if (!postRes.ok) {
        const err = (await postRes.json()) as { error?: string };
        throw new Error(err.error ?? `Save failed (${String(postRes.status)})`);
      }
      setStatus("saved");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "Save failed");
    }
  }, [canSave, types]);

  const addType = () => {
    const id = `type_${String(Date.now())}`;
    setTypes((prev) => [
      ...prev,
      {
        id,
        name: "New product type",
        description: "",
        variationDefinitions: [],
      },
    ]);
  };

  const removeType = (id: string) => {
    setTypes((prev) => prev.filter((t) => t.id !== id));
  };

  const updateType = (id: string, patch: Partial<ProductType>) => {
    setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const restoreExamples = () => {
    setTypes(structuredClone(exampleDefaults));
  };

  const idsOk = new Set(types.map((t) => t.id)).size === types.length;
  const allHaveIds = types.every((t) => t.id.trim() !== "");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">What are product types?</p>
        <p className="mt-1 text-blue-800">
          Each product must use one type. Types define variation templates
          (size, color, etc.) shown when you create products. Edit them here —
          no code required. Changes are saved to your store settings (Cloudflare
          KV).
        </p>
      </div>

      {!canSave && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Configure{" "}
          <code className="rounded bg-amber-100 px-1">SETTINGS_KV</code> in
          production so product types can be saved. In dev, settings persist in
          memory until restart.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addType}
          className="btn btn-primary rounded px-4 py-2 text-sm"
        >
          Add product type
        </button>
        <button
          type="button"
          onClick={restoreExamples}
          className="btn btn-outline rounded px-4 py-2 text-sm"
        >
          Restore starter templates
        </button>
        <button
          type="button"
          onClick={() => {
            void save();
          }}
          disabled={!canSave || !idsOk || !allHaveIds || status === "saving"}
          className="btn btn-primary rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save product types"}
        </button>
        {status === "saved" && (
          <span className="self-center text-sm text-green-600">Saved.</span>
        )}
        {status === "error" && errorMessage && (
          <span className="self-center text-sm text-red-600">
            {errorMessage}
          </span>
        )}
      </div>

      {!idsOk && (
        <p className="text-sm text-red-600">
          Each product type needs a unique ID (internal key).
        </p>
      )}

      <div className="space-y-8">
        {types.map((pt, index) => (
          <section
            key={pt.id}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <h3 className="text-lg font-medium text-gray-900">
                Product type {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => {
                  removeType(pt.id);
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor={`pt-name-${pt.id}`}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Display name *
                </label>
                <input
                  id={`pt-name-${pt.id}`}
                  type="text"
                  value={pt.name}
                  onChange={(e) => {
                    updateType(pt.id, { name: e.target.value });
                  }}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label
                  htmlFor={`pt-id-${pt.id}`}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  ID (unique key) *
                </label>
                <input
                  id={`pt-id-${pt.id}`}
                  type="text"
                  value={pt.id}
                  onChange={(e) => {
                    updateType(pt.id, {
                      id: e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, "-"),
                    });
                  }}
                  className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor={`pt-desc-${pt.id}`}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <input
                id={`pt-desc-${pt.id}`}
                type="text"
                value={pt.description ?? ""}
                onChange={(e) => {
                  updateType(pt.id, { description: e.target.value });
                }}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h4 className="mb-2 text-sm font-medium text-gray-800">
                Variation templates
              </h4>
              <p className="mb-3 text-sm text-gray-500">
                New products of this type start with these variations; you can
                still change them per product.
              </p>
              <VariationManager
                variations={pt.variationDefinitions}
                onChange={(variationDefinitions) => {
                  updateType(pt.id, { variationDefinitions });
                }}
                productType={pt.name}
              />
            </div>
          </section>
        ))}
      </div>

      {types.length === 0 && (
        <p className="text-sm text-gray-600">
          No product types yet. Add one or restore starter templates. Products
          cannot be saved until at least one type exists.
        </p>
      )}
    </div>
  );
}
