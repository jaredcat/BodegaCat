import {
  cartLineAmount,
  removeFromCart,
  updateQuantity,
  type CartItem,
} from "../lib/cartStore";

function cartLineKey(item: CartItem): string {
  return `${item.product.id}-${item.priceId}`;
}

export default function CartLine({ item }: Readonly<{ item: CartItem }>) {
  const itemKey = cartLineKey(item);

  return (
    <div className="flex space-x-4 border-b pb-4">
      <div className="shrink-0">
        <img
          src={item.product.images[0] ?? "/placeholder-image.jpg"}
          alt={item.product.name}
          className="h-16 w-16 rounded object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-gray-900">
          {item.product.name}
        </h3>

        {Object.keys(item.selectedVariations).length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {Object.entries(item.selectedVariations).map(([key, value]) => (
              <div key={key}>
                {key}: {value}
              </div>
            ))}
          </div>
        )}

        <p className="mt-1 text-sm text-gray-900">
          ${(cartLineAmount(item) / 100).toFixed(2)} each
        </p>

        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => {
              updateQuantity(itemKey, item.quantity - 1);
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => {
              updateQuantity(itemKey, item.quantity + 1);
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            aria-label="Increase quantity"
          >
            +
          </button>
          <button
            onClick={() => {
              removeFromCart(itemKey);
            }}
            className="ml-2 text-sm text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
