import { createExampleVariations } from "../lib/variationEngine";
import type {
  ProductVariationDefinition,
  ProductVariationOptionDefinition,
} from "../types/product";

interface VariationManagerProps {
  variations: ProductVariationDefinition[];
  onChange: (variations: ProductVariationDefinition[]) => void;
  productType?: string;
}

export default function VariationManager({
  variations,
  onChange,
  productType,
}: Readonly<VariationManagerProps>) {
  const addVariation = () => {
    const newVariation: ProductVariationDefinition = {
      id: `variation_${String(Date.now())}`,
      name: "new_variation",
      displayName: "New Variation",
      type: "independent",
      order: variations.length + 1,
      required: false,
      options: [],
    };
    onChange([...variations, newVariation]);
  };

  const updateVariation = (
    id: string,
    updates: Partial<ProductVariationDefinition>,
  ) => {
    const updated = variations.map((v) =>
      v.id === id ? { ...v, ...updates } : v,
    );
    onChange(updated);
  };

  const removeVariation = (id: string) => {
    const updated = variations.filter((v) => v.id !== id);
    // Reorder remaining variations
    const reordered = updated.map((v, index) => ({ ...v, order: index + 1 }));
    onChange(reordered);
  };

  const addOption = (variationId: string) => {
    const variation = variations.find((v) => v.id === variationId);
    if (!variation) return;

    const newOption: ProductVariationOptionDefinition = {
      id: `option_${String(Date.now())}`,
      name: "new_option",
      displayName: "New Option",
      priceModifier: 0,
      available: true,
    };

    const updatedVariation = {
      ...variation,
      options: [...variation.options, newOption],
    };

    updateVariation(variationId, updatedVariation);
  };

  const updateOption = (
    variationId: string,
    optionId: string,
    updates: Partial<ProductVariationOptionDefinition>,
  ) => {
    const variation = variations.find((v) => v.id === variationId);
    if (!variation) return;

    const updatedOptions = variation.options.map((o) =>
      o.id === optionId ? { ...o, ...updates } : o,
    );

    updateVariation(variationId, { options: updatedOptions });
  };

  const removeOption = (variationId: string, optionId: string) => {
    const variation = variations.find((v) => v.id === variationId);
    if (!variation) return;

    const updatedOptions = variation.options.filter((o) => o.id !== optionId);
    updateVariation(variationId, { options: updatedOptions });
  };

  const loadExampleVariations = () => {
    if (productType) {
      const examples = createExampleVariations(productType);
      onChange(examples);
    }
  };

  const moveVariation = (id: string, direction: "up" | "down") => {
    const index = variations.findIndex((v) => v.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= variations.length) return;

    const updated = [...variations];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update order numbers
    const reordered = updated.map((v, i) => ({ ...v, order: i + 1 }));
    onChange(reordered);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Variations</h3>
        <div className="space-x-2">
          {productType && (
            <button
              onClick={loadExampleVariations}
              className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              Load {productType} Template
            </button>
          )}
          <button
            onClick={addVariation}
            className="bg-primary hover:bg-primary/90 rounded px-3 py-1 text-sm text-white"
          >
            Add Variation
          </button>
        </div>
      </div>

      {variations.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <p>No variations defined yet.</p>
          <p className="mt-1 text-sm">
            {productType
              ? `Click "Load ${productType} Template" to get started, or add variations manually.`
              : "Add variations to define product options like size, color, material, etc."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {variations.map((variation, index) => (
            <div key={variation.id} className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      moveVariation(variation.id, "up");
                    }}
                    disabled={index === 0}
                    className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => {
                      moveVariation(variation.id, "down");
                    }}
                    disabled={index === variations.length - 1}
                    className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <span className="text-sm font-medium">
                    Order: {variation.order}
                  </span>
                </div>
                <button
                  onClick={() => {
                    removeVariation(variation.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor={`variation-name-${variation.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Name (ID)
                  </label>
                  <input
                    id={`variation-name-${variation.id}`}
                    type="text"
                    value={variation.name}
                    onChange={(e) => {
                      updateVariation(variation.id, { name: e.target.value });
                    }}
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., size, color"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`variation-display-${variation.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Display Name
                  </label>
                  <input
                    id={`variation-display-${variation.id}`}
                    type="text"
                    value={variation.displayName}
                    onChange={(e) => {
                      updateVariation(variation.id, {
                        displayName: e.target.value,
                      });
                    }}
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., Size, Color"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`variation-type-${variation.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Type
                  </label>
                  <select
                    id={`variation-type-${variation.id}`}
                    value={variation.type}
                    onChange={(e) => {
                      updateVariation(variation.id, {
                        type: e.target.value as "independent" | "dependent",
                      });
                    }}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="independent">
                      Independent (always shown)
                    </option>
                    <option value="dependent">
                      Dependent (shown based on other selections)
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`variation-required-${variation.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Required
                  </label>
                  <div className="flex items-center">
                    <input
                      id={`variation-required-${variation.id}`}
                      type="checkbox"
                      checked={variation.required}
                      onChange={(e) => {
                        updateVariation(variation.id, {
                          required: e.target.checked,
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      Customer must select this variation
                    </span>
                  </div>
                </div>
              </div>

              {variation.type === "dependent" && (
                <div className="mb-4">
                  <label
                    htmlFor={`variation-depends-${variation.id}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Depends On
                  </label>
                  <select
                    id={`variation-depends-${variation.id}`}
                    multiple
                    value={variation.dependsOn ?? []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      );
                      updateVariation(variation.id, { dependsOn: selected });
                    }}
                    className="w-full rounded border px-3 py-2"
                  >
                    {variations
                      .filter((v) => v.id !== variation.id)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.displayName}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl/Cmd to select multiple variations
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">Options</h4>
                  <button
                    onClick={() => {
                      addOption(variation.id);
                    }}
                    className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
                  >
                    Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {variation.options.map((option) => (
                    <div key={option.id} className="rounded border p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label
                            htmlFor={`option-name-${variation.id}-${option.id}`}
                            className="mb-1 block text-xs font-medium"
                          >
                            Name (ID)
                          </label>
                          <input
                            id={`option-name-${variation.id}-${option.id}`}
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              updateOption(variation.id, option.id, {
                                name: e.target.value,
                              });
                            }}
                            className="w-full rounded border px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`option-display-${variation.id}-${option.id}`}
                            className="mb-1 block text-xs font-medium"
                          >
                            Display Name
                          </label>
                          <input
                            id={`option-display-${variation.id}-${option.id}`}
                            type="text"
                            value={option.displayName}
                            onChange={(e) => {
                              updateOption(variation.id, option.id, {
                                displayName: e.target.value,
                              });
                            }}
                            className="w-full rounded border px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`option-price-${variation.id}-${option.id}`}
                            className="mb-1 block text-xs font-medium"
                          >
                            Price Modifier
                          </label>
                          <input
                            id={`option-price-${variation.id}-${option.id}`}
                            type="number"
                            step="0.01"
                            value={(option.priceModifier / 100).toFixed(2)}
                            onChange={(e) => {
                              updateOption(variation.id, option.id, {
                                priceModifier: Math.round(
                                  parseFloat(e.target.value) * 100,
                                ),
                              });
                            }}
                            className="w-full rounded border px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={option.available}
                              onChange={(e) => {
                                updateOption(variation.id, option.id, {
                                  available: e.target.checked,
                                });
                              }}
                              className="mr-1"
                            />
                            Available
                          </label>
                        </div>
                        <button
                          onClick={() => {
                            removeOption(variation.id, option.id);
                          }}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
