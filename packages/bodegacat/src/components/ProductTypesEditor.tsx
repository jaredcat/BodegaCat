import { useCallback, useState } from "react";
import type { ProductType } from "../types/product";
import VariationManager from "./VariationManager";

interface ProductTypesEditorProperties {
  readonly initialProductTypes: ProductType[];
  readonly exampleDefaults: ProductType[];
  readonly canSave: boolean;
}

export default function ProductTypesEditor({
  initialProductTypes,
  exampleDefaults,
  canSave,
}: Readonly<ProductTypesEditorProperties>) {
  const [types, setTypes] = useState<ProductType[]>(() =>
    structuredClone(initialProductTypes),
  );
  const [expandedTypeIds, setExpandedTypeIds] = useState<Set<string>>(
    () => new Set(types[0]?.id ? [types[0].id] : []),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const save = useCallback(async () => {
    if (!canSave) return;
    setStatus("saving");
    setErrorMessage(undefined);
    try {
      const settingsResponse = await fetch("/api/admin/settings");
      if (!settingsResponse.ok) {
        throw new Error(
          `Failed to load settings (${String(settingsResponse.status)})`,
        );
      }
      const existing = (await settingsResponse.json()) as Record<
        string,
        unknown
      >;
      const { stripe: _s, ...rest } = existing;
      const saveResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, productTypes: types }),
      });
      if (!saveResponse.ok) {
        const error = (await saveResponse.json()) as { error?: string };
        throw new Error(
          error.error ?? `Save failed (${String(saveResponse.status)})`,
        );
      }
      setStatus("saved");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  }, [canSave, types]);

  const addType = () => {
    const id = `type_${String(Date.now())}`;
    setTypes((previous) => [
      ...previous,
      {
        id,
        name: "New product type",
        description: "",
        variationDefinitions: [],
      },
    ]);
    setExpandedTypeIds((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  };

  const removeType = (id: string) => {
    setTypes((previous) => previous.filter((t) => t.id !== id));
    setExpandedTypeIds((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  };

  const updateType = (id: string, patch: Partial<ProductType>) => {
    setTypes((previous) =>
      previous.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  };

  const restoreExamples = () => {
    setTypes(structuredClone(exampleDefaults));
  };

  const isIdsOk = new Set(types.map((t) => t.id)).size === types.length;
  const isAllHaveIds = types.every((t) => t.id.trim() !== "");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">What are product types?</p>
        <p className="mt-1 text-blue-800">
          Each product must use one type. Types define variation templates
          (size, color, etc.) shown when you create products. Edit them here.
          Changes are saved to your store settings.
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
          disabled={
            !canSave || !isIdsOk || !isAllHaveIds || status === "saving"
          }
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

      {!isIdsOk && (
        <p className="text-sm text-red-600">
          Each product type needs a unique ID (internal key).
        </p>
      )}

      <div className="space-y-8">
        {types.map((pt, index) => {
          const isExpanded = expandedTypeIds.has(pt.id);
          return (
            <section
              key={pt.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedTypeIds((previous) => {
                      const next = new Set(previous);
                      if (next.has(pt.id)) next.delete(pt.id);
                      else next.add(pt.id);
                      return next;
                    });
                  }}
                  className="min-w-0 flex-1 text-left"
                  aria-controls={`product-type-panel-${pt.id}`}
                  data-expanded={isExpanded ? "true" : "false"}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                    <h2 className="truncate text-lg font-medium text-gray-900">
                      {pt.name.trim()
                        ? pt.name
                        : `Product type ${String(index + 1)}`}
                    </h2>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    <span className="font-mono">{pt.id}</span>
                    {pt.description?.trim() ? (
                      <span className="text-gray-400"> · {pt.description}</span>
                    ) : undefined}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    removeType(pt.id);
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              {isExpanded && (
                <div id={`product-type-panel-${pt.id}`} className="px-6 pb-6">
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
                              .replaceAll(/\s+/g, "-"),
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
                    <h3 className="mb-2 text-sm font-medium text-gray-800">
                      Variation templates
                    </h3>
                    <p className="mb-3 text-sm text-gray-500">
                      New products of this type start with these variations; you
                      can still change them per product.
                    </p>
                    <VariationManager
                      variations={pt.variationDefinitions}
                      onChange={(variationDefinitions) => {
                        updateType(pt.id, { variationDefinitions });
                      }}
                      productType={pt.name}
                    />
                  </div>
                </div>
              )}
            </section>
          );
        })}
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
