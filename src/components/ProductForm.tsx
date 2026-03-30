import { useState } from "react";
import type { Product, ProductType } from "../types/product";
import VariationManager from "./VariationManager";

interface ProductFormProps {
  readonly product?: Product;
  readonly productTypes: ProductType[];
  readonly onSubmit: (productData: Partial<Product>) => Promise<void>;
  readonly onCancel: () => void;
}

export default function ProductForm({
  product,
  productTypes,
  onSubmit,
  onCancel,
}: Readonly<ProductFormProps>) {
  const [formData, setFormData] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    basePrice: product?.basePrice ? (product.basePrice / 100).toString() : "",
    currency: product?.currency ?? "usd",
    productTypeId: product?.metadata.productTypeId ?? "",
    category: product?.metadata.category ?? "",
    brand: product?.metadata.brand ?? "",
    sku: product?.metadata.sku ?? "",
    tags: product?.metadata.tags.join(", ") ?? "",
    active: product?.active ?? true,
    images: product?.images ?? [],
  });

  const [variations, setVariations] = useState(
    product?.variationDefinitions ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      newErrors.basePrice = "Valid price is required";
    }

    if (!formData.productTypeId) {
      newErrors.productTypeId = "Product type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      basePrice: Math.round(parseFloat(formData.basePrice) * 100),
      currency: formData.currency,
      metadata: {
        productTypeId: formData.productTypeId,
        category: formData.category.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        sku: formData.sku.trim() || undefined,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
      active: formData.active,
      images: formData.images,
      variationDefinitions: variations,
    };

    onSubmit(productData)
      .catch((error: unknown) => {
        console.error("Error submitting product:", error);
        setErrors({ submit: "Failed to save product. Please try again." });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // For now, we'll just store the file names
    // In a real implementation, you'd upload these to a CDN
    const newImageUrls = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImageUrls],
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const selectedProductType = productTypes.find(
    (pt) => pt.id === formData.productTypeId,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Product Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
              }}
              className={`w-full rounded border px-3 py-2 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
              rows={4}
              className={`w-full rounded border px-3 py-2 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter product description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="basePrice"
              className="mb-1 block text-sm font-medium"
            >
              Base Price *
            </label>
            <input
              id="basePrice"
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, basePrice: e.target.value }));
              }}
              className={`w-full rounded border px-3 py-2 ${
                errors.basePrice ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0.00"
            />
            {errors.basePrice && (
              <p className="mt-1 text-sm text-red-500">{errors.basePrice}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="currency"
              className="mb-1 block text-sm font-medium"
            >
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, currency: e.target.value }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </div>
        </div>

        {/* Product Type and Metadata */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="productType"
              className="mb-1 block text-sm font-medium"
            >
              Product Type *
            </label>
            <select
              id="productType"
              value={formData.productTypeId}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  productTypeId: e.target.value,
                }));
              }}
              className={`w-full rounded border px-3 py-2 ${
                errors.productTypeId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select a product type</option>
              {productTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.productTypeId && (
              <p className="mt-1 text-sm text-red-500">
                {errors.productTypeId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1 block text-sm font-medium"
            >
              Category
            </label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, category: e.target.value }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g., Clothing, Electronics"
            />
          </div>

          <div>
            <label htmlFor="brand" className="mb-1 block text-sm font-medium">
              Brand
            </label>
            <input
              id="brand"
              type="text"
              value={formData.brand}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, brand: e.target.value }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Brand name"
            />
          </div>

          <div>
            <label htmlFor="sku" className="mb-1 block text-sm font-medium">
              SKU
            </label>
            <input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, sku: e.target.value }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Stock keeping unit"
            />
          </div>

          <div>
            <label htmlFor="tags" className="mb-1 block text-sm font-medium">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, tags: e.target.value }));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, active: e.target.checked }));
              }}
              className="mr-2"
            />
            <label htmlFor="active" className="text-sm font-medium">
              Active (available for purchase)
            </label>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div>
        <label
          htmlFor="product-images"
          className="mb-2 block text-sm font-medium"
        >
          Product Images
        </label>
        <input
          id="product-images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        {formData.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Product ${String(index + 1)}`}
                  className="h-32 w-full rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Variations */}
      <VariationManager
        variations={variations}
        onChange={setVariations}
        productType={selectedProductType?.name}
      />

      {/* Error Messages */}
      {errors.submit && (
        <div className="rounded border border-red-200 bg-red-50 p-3">
          <p className="text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}
