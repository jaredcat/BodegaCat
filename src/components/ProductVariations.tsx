import { useCallback, useEffect, useMemo, useState } from "react";
import { addToCart } from "../lib/cartStore";
import {
  createVariationState,
  getCurrentVariationImage,
  updateSelection,
} from "../lib/variationEngine";
import type { Product } from "../types/product";

interface ProductVariationsProps {
  product: Product;
  onVariationChange?: (
    selections: Record<string, string>,
    totalPrice: number,
  ) => void;
}

export default function ProductVariations({
  product,
  onVariationChange,
}: Readonly<ProductVariationsProps>) {
  const autoSelections = useMemo(() => {
    if (product.variationDefinitions.length !== 1) return {};
    const variation = product.variationDefinitions[0];
    if (variation.options.length !== 1) return {};
    return { [variation.id]: variation.options[0].id };
  }, [product.variationDefinitions]);

  const [selections, setSelections] = useState(autoSelections);
  const [quantity, setQuantity] = useState(1);

  const variationState = useMemo(
    () => createVariationState(product.variationDefinitions, selections),
    [product.variationDefinitions, selections],
  );

  useEffect(() => {
    const totalPrice = product.basePrice + variationState.totalPrice;
    onVariationChange?.(selections, totalPrice);
  }, [
    selections,
    product.basePrice,
    onVariationChange,
    variationState.totalPrice,
  ]);

  // Handle selection changes
  const handleSelectionChange = useCallback(
    (variationId: string, optionId: string) => {
      setSelections((prev) =>
        updateSelection(
          product.variationDefinitions,
          prev,
          variationId,
          optionId,
        ),
      );
    },
    [product.variationDefinitions],
  );

  // Keep selections in sync if product/definitions change and auto-selection applies.
  useEffect(() => {
    if (Object.keys(autoSelections).length === 0) return;
    queueMicrotask(() => {
      setSelections((prev) => ({ ...autoSelections, ...prev }));
    });
  }, [autoSelections]);

  // Handle add to cart
  const handleAddToCart = () => {
    console.log("handleAddToCart called with:", {
      product: product.name,
      quantity,
      selections,
      totalPrice: product.basePrice + variationState.totalPrice,
    });

    try {
      addToCart(
        product,
        quantity,
        selections,
        product.basePrice + variationState.totalPrice,
      );
      console.log("addToCart completed successfully");
    } catch (error) {
      console.error("Error in addToCart:", error);
    }
  };

  // If no variations, show simple add to cart
  if (!product.variationDefinitions.length) {
    return (
      <div className="space-y-6">
        {/* Quantity Selector */}
        <div className="space-y-3">
          <label
            htmlFor="quantity-simple"
            className="block text-sm font-medium"
          >
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            >
              -
            </button>
            <span className="w-12 text-center">{quantity}</span>
            <button
              onClick={() => {
                setQuantity(quantity + 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total Price:</span>
            <span className="text-primary text-2xl font-bold">
              ${(product.basePrice / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="bg-primary hover:bg-primary/90 w-full rounded-md px-4 py-3 font-medium text-white transition-colors"
        >
          Add to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Product Options</h3>

      {/* Variation Selectors */}
      {variationState.variations
        .filter((variation) => variation.isVisible)
        .map((variation) => {
          const selectedOptionId = selections[variation.id];
          const availableOptions = variation.options.filter(
            (option) => option.isVisible,
          );

          return (
            <div key={variation.id} className="space-y-3">
              <label className="block text-sm font-medium">
                {variation.displayName}
                {variation.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
                {variation.type === "dependent" && (
                  <span className="ml-2 text-xs text-gray-500">
                    (depends on{" "}
                    {variation.dependsOn
                      ?.map((id) => {
                        const dep = product.variationDefinitions.find(
                          (v) => v.id === id,
                        );
                        return dep?.displayName ?? id;
                      })
                      .join(", ")}
                    )
                  </span>
                )}
              </label>

              <div className="space-y-2">
                {/* Radio buttons for options */}
                <div className="space-y-2">
                  {availableOptions.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    let priceDisplay = "";
                    if (option.priceModifier !== 0) {
                      const sign = option.priceModifier > 0 ? "+" : "";
                      priceDisplay = ` (${sign}$${(option.priceModifier / 100).toFixed(2)})`;
                    }

                    let labelClassName =
                      "flex cursor-pointer items-center rounded-lg border p-3 transition-colors";
                    if (isSelected) {
                      labelClassName += " border-primary bg-primary/5";
                    } else if (option.available) {
                      labelClassName += " hover:border-primary border-gray-300";
                    } else {
                      labelClassName +=
                        " cursor-not-allowed border-gray-200 bg-gray-50";
                    }

                    return (
                      <label key={option.id} className={labelClassName}>
                        <input
                          type="radio"
                          name={`variation-${variation.id}`}
                          value={option.id}
                          checked={isSelected}
                          onChange={() => {
                            if (option.available) {
                              handleSelectionChange(variation.id, option.id);
                            }
                          }}
                          disabled={!option.available}
                          className="sr-only"
                        />
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`mr-3 h-4 w-4 rounded-full border-2 ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <div className="m-0.5 h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                option.available
                                  ? "text-gray-900"
                                  : "text-gray-400"
                              }`}
                            >
                              {option.displayName}
                              {priceDisplay}
                            </span>
                          </div>
                          {option.images?.[0] && (
                            <img
                              src={option.images[0]}
                              alt={option.displayName}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Show validation error if required variation is missing */}
              {variation.required && !selectedOptionId && (
                <p className="text-sm text-red-500">
                  Please select a {variation.displayName.toLowerCase()}
                </p>
              )}
            </div>
          );
        })}

      {/* Quantity Selector */}
      <div className="space-y-3">
        <label
          htmlFor="quantity-variations"
          className="block text-sm font-medium"
        >
          Quantity
        </label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setQuantity(Math.max(1, quantity - 1));
            }}
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
          >
            -
          </button>
          <span className="w-12 text-center">{quantity}</span>
          <button
            onClick={() => {
              setQuantity(quantity + 1);
            }}
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Total Price:</span>
          <span className="text-primary text-2xl font-bold">
            $
            {((product.basePrice + variationState.totalPrice) / 100).toFixed(2)}
          </span>
        </div>
        {variationState.totalPrice !== 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Base price: ${(product.basePrice / 100).toFixed(2)} + options: $
            {(variationState.totalPrice / 100).toFixed(2)}
          </p>
        )}
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!variationState.isValid}
        className={`w-full rounded-md px-4 py-3 font-medium transition-colors ${
          variationState.isValid
            ? "bg-primary hover:bg-primary/90 text-white"
            : "cursor-not-allowed bg-gray-300 text-gray-500"
        }`}
      >
        {variationState.isValid
          ? "Add to Cart"
          : "Please select required options"}
      </button>

      {/* Current Image Display */}
      {(() => {
        const currentImage = getCurrentVariationImage(
          product.variationDefinitions,
          selections,
          product.images,
        );

        if (currentImage) {
          return (
            <div className="border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">
                Selected Option Preview:
              </h4>
              <img
                src={currentImage}
                alt="Selected option preview"
                className="h-24 w-24 rounded-lg object-cover"
              />
            </div>
          );
        }
        return null;
      })()}

      {/* Validation Errors */}
      {!variationState.isValid && variationState.missingRequired.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm text-red-500">
            Please select: {variationState.missingRequired.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
