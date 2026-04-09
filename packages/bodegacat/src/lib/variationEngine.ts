import type {
  ProductVariation,
  ProductVariationDefinition,
  ProductVariationOptionDefinition,
} from "../types/product";

export interface VariationSelection {
  variationId: string;
  optionId: string;
}

export interface VariationState {
  variations: ProductVariation[];
  totalPrice: number;
  isValid: boolean;
  missingRequired: string[];
}

/**
 * Converts variation definitions to runtime variation state
 */
export function createVariationState(
  definitions: ProductVariationDefinition[],
  selections: Record<string, string> = {},
): VariationState {
  const variations = definitions.map((def) => ({
    ...def,
    options: def.options.map((opt) => ({
      ...opt,
      isVisible: isOptionVisible(def, opt, definitions, selections),
    })),
    isVisible: isVariationVisible(def, definitions, selections),
  }));

  const totalPrice = calculateTotalPrice(definitions, selections);
  const { isValid, missingRequired } = validateSelections(
    definitions,
    selections,
  );

  const sortedVariations = variations.toSorted((a, b) => a.order - b.order);

  return {
    variations: sortedVariations,
    totalPrice,
    isValid,
    missingRequired,
  };
}

/**
 * Determines if a variation should be visible based on current selections
 */
function isVariationVisible(
  variation: ProductVariationDefinition,
  allVariations: ProductVariationDefinition[],
  selections: Record<string, string>,
): boolean {
  // Independent variations are always visible
  if (variation.type === "independent") {
    return true;
  }

  // Dependent variations are only visible if their dependencies are satisfied
  if (variation.dependsOn && variation.dependsOn.length > 0) {
    return variation.dependsOn.every((depId) => {
      const depVariation = allVariations.find((v) => v.id === depId);
      if (!depVariation) return false;

      const selectedOptionId = selections[depId];
      if (!selectedOptionId) return false;

      // Check if any option in this variation is available for the selected dependency
      return variation.options.some((option) =>
        isOptionAvailableForSelection(option, depId, selectedOptionId),
      );
    });
  }

  return true;
}

/**
 * Determines if an option should be visible based on current selections
 */

function isOptionVisible(
  variation: ProductVariationDefinition,
  option: ProductVariationOptionDefinition,
  allVariations: ProductVariationDefinition[],
  selections: Record<string, string>,
): boolean {
  // If the variation is not visible, the option is not visible
  if (!isVariationVisible(variation, allVariations, selections)) {
    return false;
  }

  // If option is not available, it's not visible
  if (!option.available) {
    return false;
  }

  // If option has no availability constraints, it's visible
  if (!option.availableFor || option.availableFor.length === 0) {
    return true;
  }

  // Check if current selections match any of the availableFor conditions
  for (const condition of option.availableFor) {
    const selectedOptionId = selections[condition.variationId];
    if (selectedOptionId && condition.optionIds.includes(selectedOptionId)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if an option is available for a specific selection
 */
function isOptionAvailableForSelection(
  option: ProductVariationOptionDefinition,
  variationId: string,
  selectedOptionId: string,
): boolean {
  if (!option.availableFor) return true;

  const condition = option.availableFor.find(
    (c) => c.variationId === variationId,
  );
  if (!condition) return true;

  return condition.optionIds.includes(selectedOptionId);
}

/**
 * Calculates total price based on base price and selected variations
 */
function calculateTotalPrice(
  definitions: ProductVariationDefinition[],
  selections: Record<string, string>,
): number {
  let total = 0; // Base price will be added by the caller

  Object.entries(selections).forEach(([variationId, optionId]) => {
    const variation = definitions.find((v) => v.id === variationId);
    const option = variation?.options.find((o) => o.id === optionId);

    if (option) {
      total += option.priceModifier;
    }
  });

  return total;
}

/**
 * Validates that all required variations have selections
 */
function validateSelections(
  definitions: ProductVariationDefinition[],
  selections: Record<string, string>,
): { isValid: boolean; missingRequired: string[] } {
  const missingRequired: string[] = [];

  definitions.forEach((variation) => {
    if (variation.required && !selections[variation.id]) {
      missingRequired.push(variation.name);
    }
  });

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
  };
}

/**
 * Gets available options for a variation based on current selections
 */
export function getAvailableOptions(
  variation: ProductVariationDefinition,
  allVariations: ProductVariationDefinition[],
  selections: Record<string, string>,
): ProductVariationOptionDefinition[] {
  return variation.options.filter((option) =>
    isOptionVisible(variation, option, allVariations, selections),
  );
}

/**
 * Updates selections and returns new state
 */
export function updateSelection(
  definitions: ProductVariationDefinition[],
  currentSelections: Record<string, string>,
  variationId: string,
  optionId: string,
): Record<string, string> {
  const newSelections = { ...currentSelections, [variationId]: optionId };

  // Clear dependent selections that are no longer valid
  const validSelections: Record<string, string> = {};

  Object.entries(newSelections).forEach(([key, value]) => {
    const variation = definitions.find((v) => v.id === key);
    if (!variation) {
      validSelections[key] = value;
      return;
    }

    if (
      variation.type === "dependent" &&
      variation.dependsOn?.includes(variationId)
    ) {
      const isStillValid = variation.options.some(
        (option) =>
          option.id === value &&
          isOptionVisible(variation, option, definitions, newSelections),
      );

      if (isStillValid) {
        validSelections[key] = value;
      }
    } else {
      validSelections[key] = value;
    }
  });

  return validSelections;
}

/**
 * Gets the current variation image based on selections
 */
export function getCurrentVariationImage(
  definitions: ProductVariationDefinition[],
  selections: Record<string, string>,
  baseImages: string[],
): string | undefined {
  // Check for images in selected options
  for (const [variationId, optionId] of Object.entries(selections)) {
    const variation = definitions.find((v) => v.id === variationId);
    const option = variation?.options.find((o) => o.id === optionId);

    if (option?.images?.[0]) {
      return option.images[0];
    }
  }

  // Fall back to base images
  return baseImages[0];
}

/**
 * Creates example variation definitions for common product types
 */
export function createExampleVariations(
  productType: string,
): ProductVariationDefinition[] {
  switch (productType.toLowerCase()) {
    case "shirt":
      return [
        {
          id: "size",
          name: "size",
          displayName: "Size",
          type: "independent",
          order: 1,
          required: true,
          options: [
            {
              id: "xs",
              name: "xs",
              displayName: "XS",
              priceModifier: 0,
              available: true,
            },
            {
              id: "s",
              name: "s",
              displayName: "S",
              priceModifier: 0,
              available: true,
            },
            {
              id: "m",
              name: "m",
              displayName: "M",
              priceModifier: 0,
              available: true,
            },
            {
              id: "l",
              name: "l",
              displayName: "L",
              priceModifier: 0,
              available: true,
            },
            {
              id: "xl",
              name: "xl",
              displayName: "XL",
              priceModifier: 500,
              available: true,
            },
            {
              id: "xxl",
              name: "xxl",
              displayName: "XXL",
              priceModifier: 1000,
              available: true,
            },
          ],
        },
        {
          id: "color",
          name: "color",
          displayName: "Color",
          type: "dependent",
          order: 2,
          required: true,
          dependsOn: ["size"],
          options: [
            {
              id: "red",
              name: "red",
              displayName: "Red",
              priceModifier: 0,
              available: true,
              availableFor: [
                { variationId: "size", optionIds: ["s", "m", "l", "xl"] },
              ],
            },
            {
              id: "blue",
              name: "blue",
              displayName: "Blue",
              priceModifier: 0,
              available: true,
              availableFor: [
                { variationId: "size", optionIds: ["m", "l", "xl", "xxl"] },
              ],
            },
            {
              id: "green",
              name: "green",
              displayName: "Green",
              priceModifier: 200,
              available: true,
              availableFor: [{ variationId: "size", optionIds: ["l", "xl"] }],
            },
          ],
        },
      ];

    case "art":
      return [
        {
          id: "material",
          name: "material",
          displayName: "Material",
          type: "independent",
          order: 1,
          required: true,
          options: [
            {
              id: "canvas",
              name: "canvas",
              displayName: "Canvas",
              priceModifier: 0,
              available: true,
            },
            {
              id: "paper",
              name: "paper",
              displayName: "Paper",
              priceModifier: -500,
              available: true,
            },
            {
              id: "metal",
              name: "metal",
              displayName: "Metal",
              priceModifier: 1000,
              available: true,
            },
          ],
        },
        {
          id: "size",
          name: "size",
          displayName: "Size",
          type: "dependent",
          order: 2,
          required: true,
          dependsOn: ["material"],
          options: [
            {
              id: "small",
              name: "small",
              displayName: "Small (8x10)",
              priceModifier: 0,
              available: true,
              availableFor: [
                { variationId: "material", optionIds: ["canvas", "paper"] },
              ],
            },
            {
              id: "medium",
              name: "medium",
              displayName: "Medium (16x20)",
              priceModifier: 1500,
              available: true,
              availableFor: [
                {
                  variationId: "material",
                  optionIds: ["canvas", "paper", "metal"],
                },
              ],
            },
            {
              id: "large",
              name: "large",
              displayName: "Large (24x36)",
              priceModifier: 3000,
              available: true,
              availableFor: [
                { variationId: "material", optionIds: ["canvas", "metal"] },
              ],
            },
          ],
        },
      ];

    default:
      return [];
  }
}
