# Product Variation System

This document describes the robust product variation system that supports independent and dependent variations with proper ordering and validation.

## Overview

The new variation system allows you to define complex product configurations that handle real-world scenarios like:

- **Shirts**: Size (independent) → Color (dependent on size)
- **Art Prints**: Material (independent) → Size (dependent on material)
- **Electronics**: Model (independent) → Storage (dependent on model) → Color (dependent on model + storage)

## Core Concepts

### 1. Variation Types

#### Independent Variations

- Always shown to customers
- Not affected by other selections
- Examples: Size, Material, Model

#### Dependent Variations

- Only shown when their dependencies are satisfied
- Options may change based on parent selections
- Examples: Color (depends on Size), Storage (depends on Model)

### 2. Variation Order

The order of variations matters for dependent relationships:

- **Size → Color**: Picking a size shows different color options
- **Color → Size**: Picking a color shows different size options

### 3. Option Availability

Each option can define which parent selections it's available for:

```typescript
{
  id: "red",
  name: "red",
  displayName: "Red",
  availableFor: [
    { variationId: "size", optionIds: ["s", "m", "l", "xl"] }
  ]
}
```

## Data Structure

### ProductVariationDefinition

```typescript
interface ProductVariationDefinition {
  id: string;                    // Unique identifier
  name: string;                  // Internal name (e.g., "size")
  displayName: string;           // User-facing name (e.g., "Size")
  type: "independent" | "dependent";
  order: number;                 // Display/processing order
  required: boolean;             // Must be selected
  dependsOn?: string[];          // Array of variation IDs this depends on
  options: ProductVariationOptionDefinition[];
}
```

### ProductVariationOptionDefinition

```typescript
interface ProductVariationOptionDefinition {
  id: string;                    // Unique identifier
  name: string;                  // Internal name (e.g., "xl")
  displayName: string;           // User-facing name (e.g., "XL")
  priceModifier: number;         // Price adjustment in cents
  available: boolean;            // Whether this option is available
  images?: string[];             // Option-specific images
  availableFor?: Array<{         // For dependent options
    variationId: string;
    optionIds: string[];
  }>;
}
```

## Example Configurations

### Shirt Product

```typescript
const shirtVariations: ProductVariationDefinition[] = [
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
      { id: "xl", name: "xl", displayName: "XL", priceModifier: 500, available: true },
      { id: "xxl", name: "xxl", displayName: "XXL", priceModifier: 1000, available: true },
    ]
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
        availableFor: [{ variationId: "size", optionIds: ["s", "m", "l", "xl"] }]
      },
      {
        id: "blue",
        name: "blue",
        displayName: "Blue",
        priceModifier: 0,
        available: true,
        availableFor: [{ variationId: "size", optionIds: ["m", "l", "xl", "xxl"] }]
      },
      {
        id: "green",
        name: "green",
        displayName: "Green",
        priceModifier: 200,
        available: true,
        availableFor: [{ variationId: "size", optionIds: ["l", "xl"] }]
      }
    ]
  }
];
```

### Art Print Product

```typescript
const artVariations: ProductVariationDefinition[] = [
  {
    id: "material",
    name: "material",
    displayName: "Material",
    type: "independent",
    order: 1,
    required: true,
    options: [
      { id: "canvas", name: "canvas", displayName: "Canvas", priceModifier: 0, available: true },
      { id: "paper", name: "paper", displayName: "Paper", priceModifier: -500, available: true },
      { id: "metal", name: "metal", displayName: "Metal", priceModifier: 1000, available: true },
    ]
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
        availableFor: [{ variationId: "material", optionIds: ["canvas", "paper"] }]
      },
      {
        id: "medium",
        name: "medium",
        displayName: "Medium (16x20)",
        priceModifier: 1500,
        available: true,
        availableFor: [{ variationId: "material", optionIds: ["canvas", "paper", "metal"] }]
      },
      {
        id: "large",
        name: "large",
        displayName: "Large (24x36)",
        priceModifier: 3000,
        available: true,
        availableFor: [{ variationId: "material", optionIds: ["canvas", "metal"] }]
      }
    ]
  }
];
```

## Usage

### 1. Creating Variation State

```typescript
import { createVariationState } from "../lib/variationEngine";

const variationState = createVariationState(
  product.variationDefinitions,
  currentSelections
);
```

### 2. Updating Selections

```typescript
import { updateSelection } from "../lib/variationEngine";

const newSelections = updateSelection(
  product.variationDefinitions,
  currentSelections,
  variationId,
  optionId
);
```

### 3. Getting Available Options

```typescript
import { getAvailableOptions } from "../lib/variationEngine";

const availableOptions = getAvailableOptions(
  variation,
  allVariations,
  currentSelections
);
```

### 4. Getting Variation Images

```typescript
import { getCurrentVariationImage } from "../lib/variationEngine";

const currentImage = getCurrentVariationImage(
  product.variationDefinitions,
  selections,
  product.images
);
```

## Admin Interface

The `VariationManager` component provides a full interface for:

- Adding/removing variations
- Setting variation types (independent/dependent)
- Defining dependencies
- Managing options and their availability
- Setting price modifiers
- Reordering variations
- Loading product-type templates

### Key Features

- **Template Loading**: Pre-configured variations for common product types
- **Drag & Drop Ordering**: Reorder variations with up/down buttons
- **Dependency Management**: Visual interface for setting up dependent relationships
- **Option Availability**: Configure which options are available for which parent selections
- **Price Modifiers**: Set price adjustments for each option
- **Validation**: Real-time validation of required selections

## Best Practices

### 1. Variation Naming

- Use lowercase, underscore-separated names for IDs: `"product_size"`, `"shirt_color"`
- Use proper case for display names: `"Product Size"`, `"Shirt Color"`

### 2. Ordering

- Put independent variations first
- Order dependent variations based on logical flow
- Consider user experience when setting order

### 3. Dependencies

- Keep dependency chains simple (avoid deep nesting)
- Ensure all dependent options have proper `availableFor` configurations
- Test all possible selection combinations

### 4. Price Modifiers

- Use positive values for upgrades
- Use negative values for downgrades
- Keep modifiers reasonable relative to base price

### 5. Option Availability

- Always provide at least one available option for each variation
- Consider inventory constraints when setting availability
- Test edge cases where no options might be available

## Migration from Old System

The old variation system used a simpler structure:

```typescript
// Old system
variations: ProductVariation[] // Simple array of variations

// New system
variationDefinitions: ProductVariationDefinition[] // Robust definitions
```

To migrate existing products:

1. Convert existing variations to the new structure
2. Set appropriate types (independent/dependent)
3. Define dependencies and availability rules
4. Update price calculations to use modifiers instead of absolute prices

## Testing

Test your variation configurations with:

- All possible selection combinations
- Edge cases (no available options)
- Price calculations
- Image display logic
- Validation messages

The system includes comprehensive validation and will show appropriate error messages for missing required selections.
