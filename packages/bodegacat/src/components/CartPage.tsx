import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { cartCount, cartItems, cartTotal, clearCart, initializeCart, removeFromCart, updateQuantity } from '../lib/cartStore';

export default function CartPage() {
  const items = useStore(cartItems);
  const count = useStore(cartCount);
  const total = useStore(cartTotal);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    initializeCart();
  }, []);

  const handleCheckout = async () => {
    try {
      // Create checkout session with all cart items
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: Object.values(items).map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedVariations: item.selectedVariations,
          })),
        }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (data.url) {
        // Clear cart and redirect to Stripe Checkout
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  const cartItemsArray = Object.values(items);

  if (count === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Shopping Cart {isClient && `(${count.toString()} items)`}
        </h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
          <div className="mt-6">
            <a
              href="/shop"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart {isClient && `(${count.toString()} items)`}
      </h1>

      <div className="bg-white rounded-lg shadow">
        {/* Cart Items */}
        <div className="p-6 space-y-4">
          {cartItemsArray.map((item) => {
            const itemKey = `${item.product.id}-${JSON.stringify(item.selectedVariations)}`;
            return (
              <div key={itemKey} className="flex space-x-4 border-b pb-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img
                    src={item.product.images[0] ?? '/placeholder-image.jpg'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {item.product.name}
                  </h3>

                  {/* Variations */}
                  {Object.keys(item.selectedVariations).length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {Object.entries(item.selectedVariations).map(([key, value]) => (
                        <div key={key}>
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <p className="text-sm text-gray-900 mt-1">
                    ${(item.totalPrice / 100).toFixed(2)} each
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => { updateQuantity(itemKey, item.quantity - 1); }}
                      className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="text-sm w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => { updateQuantity(itemKey, item.quantity + 1); }}
                      className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => { removeFromCart(itemKey); }}
                      className="text-red-500 hover:text-red-700 text-sm ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-6 space-y-4">
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total:</span>
            <span className="text-xl font-bold text-primary">
              ${(total / 100).toFixed(2)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => { void handleCheckout(); }}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Checkout ({count} items)
          </button>

          {/* Clear Cart */}
          <button
            onClick={clearCart}
            className="w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
