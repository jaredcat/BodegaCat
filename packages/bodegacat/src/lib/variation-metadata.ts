import type { ProductVariationDefinition } from "../types/product";

/**
Stripe metadata values are limited to 500 characters.
*/
const STRIPE_METADATA_VALUE_LIMIT = 500;

export function readVariationMetadata(
  metadata: Record<string, string | undefined>,
): ProductVariationDefinition[] | undefined {
  const partsRaw = metadata.variations_parts;
  let json: string | undefined;
  if (partsRaw) {
    const count = Number(partsRaw);
    if (!Number.isSafeInteger(count) || count < 1) return undefined;
    let joined = "";
    for (let index = 0; index < count; index += 1) {
      joined += metadata[`variations_${String(index)}`] ?? "";
    }
    json = joined;
  } else {
    json = metadata.variations;
  }

  if (!json) return undefined;
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed)
      ? (parsed as ProductVariationDefinition[])
      : undefined;
  } catch {
    return undefined;
  }
}

/**
Metadata patch for variation definitions. Existing chunk keys are cleared
with an empty string, which Stripe treats as a delete.
*/
export function variationMetadataPatch(
  definitions: ProductVariationDefinition[],
  existingKeys: string[],
): Record<string, string> {
  const json = JSON.stringify(definitions);
  const patch: Record<string, string> = {};

  for (const key of existingKeys) {
    if (
      key === "variations" ||
      key === "variations_parts" ||
      /^variations_\d+$/.test(key)
    ) {
      patch[key] = "";
    }
  }

  if (json.length <= STRIPE_METADATA_VALUE_LIMIT) {
    patch.variations = json;
    return patch;
  }

  const chunkCount = Math.ceil(json.length / STRIPE_METADATA_VALUE_LIMIT);
  if (chunkCount > 40) {
    throw new Error(
      "Variation definitions are too large to store on the Stripe product",
    );
  }

  patch.variations_parts = String(chunkCount);
  for (let index = 0; index < chunkCount; index += 1) {
    const start = index * STRIPE_METADATA_VALUE_LIMIT;
    patch[`variations_${String(index)}`] = json.slice(
      start,
      start + STRIPE_METADATA_VALUE_LIMIT,
    );
  }
  return patch;
}
