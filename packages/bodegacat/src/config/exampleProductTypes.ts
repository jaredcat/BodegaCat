import type { ProductType } from "../types/product";

// ─── Example variation templates ──────────────────────────────────────────────
// These are starting-point templates shown in the admin UI when creating a product.
// They are NOT applied automatically. Rename/replace/remove them to suit your store.
// Default starter templates (also the package default until merchants edit **Admin → Product types**).
// Optional: pass the same array to `bodegacat({ productTypes })` for a dev-only override.

export const exampleProductTypes: ProductType[] = [
  {
    id: "clothing",
    name: "Clothing",
    description: "Apparel and accessories",
    variationDefinitions: [
      {
        id: "size",
        name: "size",
        displayName: "Size",
        type: "independent",
        order: 1,
        required: true,
        options: [
          { id: "xs", name: "xs", displayName: "XS", priceModifier: 0, available: true },
          { id: "s", name: "s", displayName: "S", priceModifier: 0, available: true },
          { id: "m", name: "m", displayName: "M", priceModifier: 0, available: true },
          { id: "l", name: "l", displayName: "L", priceModifier: 0, available: true },
          { id: "xl", name: "xl", displayName: "XL", priceModifier: 200, available: true },
          { id: "xxl", name: "xxl", displayName: "XXL", priceModifier: 400, available: true },
        ],
      },
      {
        id: "color",
        name: "color",
        displayName: "Color",
        type: "independent",
        order: 2,
        required: true,
        options: [
          { id: "black", name: "black", displayName: "Black", priceModifier: 0, available: true },
          { id: "white", name: "white", displayName: "White", priceModifier: 0, available: true },
          { id: "navy", name: "navy", displayName: "Navy", priceModifier: 0, available: true },
          { id: "gray", name: "gray", displayName: "Gray", priceModifier: 0, available: true },
        ],
      },
    ],
  },
  {
    id: "prints",
    name: "Prints",
    description: "Art prints and posters",
    variationDefinitions: [
      {
        id: "size",
        name: "size",
        displayName: "Size",
        type: "independent",
        order: 1,
        required: true,
        options: [
          { id: "8x10", name: "8x10", displayName: '8" x 10"', priceModifier: 0, available: true },
          { id: "11x14", name: "11x14", displayName: '11" x 14"', priceModifier: 500, available: true },
          { id: "16x20", name: "16x20", displayName: '16" x 20"', priceModifier: 1500, available: true },
          { id: "24x36", name: "24x36", displayName: '24" x 36"', priceModifier: 2500, available: true },
        ],
      },
      {
        id: "material",
        name: "material",
        displayName: "Material",
        type: "independent",
        order: 2,
        required: true,
        options: [
          { id: "paper", name: "paper", displayName: "Paper", priceModifier: 0, available: true },
          { id: "canvas", name: "canvas", displayName: "Canvas", priceModifier: 1000, available: true },
          { id: "vinyl", name: "vinyl", displayName: "Vinyl", priceModifier: 500, available: true },
        ],
      },
    ],
  },
  {
    id: "digital",
    name: "Digital",
    description: "Digital downloads",
    variationDefinitions: [],
  },
];
