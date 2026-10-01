import { exampleProductTypes } from "../config/exampleProductTypes";
import type {
  ProductVariation,
  ProductVariationDefinition,
  ProductVariationOptionDefinition,
} from "../types/product";
import { canonicalSelection } from "./selection";

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
      const depVariation = allVariations.some((v) => v.id === depId);
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
/**
 * Every combination a buyer can check out. Option `available: false` is omitted.
 * Dependent options are included only when their parent selection allows them.
 * A product with no variation definitions has one empty selection.
 */
export function listSellableCombinations(
  definitions: ProductVariationDefinition[],
): { selection: Record<string, string>; priceModifier: number }[] {
  if (definitions.length === 0) {
    return [{ selection: {}, priceModifier: 0 }];
  }

  const results: {
    selection: Record<string, string>;
    priceModifier: number;
  }[] = [];

  function walk(
    remaining: ProductVariationDefinition[],
    selection: Record<string, string>,
  ) {
    const ready = remaining.filter((definition) => {
      if (!isVariationVisible(definition, definitions, selection)) return false;
      return definition.options.some((option) =>
        isOptionVisible(definition, option, definitions, selection),
      );
    });

    if (ready.length === 0) {
      if (Object.keys(selection).length === 0) return;
      const { isValid } = validateSelections(definitions, selection);
      if (!isValid) return;
      results.push({
        selection,
        priceModifier: calculateTotalPrice(definitions, selection),
      });
      return;
    }

    const next = ready[0];
    const rest = remaining.filter((definition) => definition.id !== next.id);
    const options = next.options.filter((option) =>
      isOptionVisible(next, option, definitions, selection),
    );

    for (const option of options) {
      walk(rest, { ...selection, [next.id]: option.id });
    }
  }

  walk(definitions, {});

  const unique = new Map<
    string,
    { selection: Record<string, string>; priceModifier: number }
  >();
  for (const result of results) {
    unique.set(canonicalSelection(result.selection), result);
  }
  return [...unique.values()];
}

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
 * Variation definitions from the starter product type with this name or id.
 * Returns a copy so the editor does not mutate `exampleProductTypes`.
 */
export function createExampleVariations(
  productType: string,
): ProductVariationDefinition[] {
  const key = productType.toLowerCase();
  const match = exampleProductTypes.find(
    (type) => type.id.toLowerCase() === key || type.name.toLowerCase() === key,
  );
  return structuredClone(match?.variationDefinitions ?? []);
}
