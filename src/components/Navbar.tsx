import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { cartCount, initializeCart, toggleCart } from "../lib/cartStore";
import type { SiteConfig } from "../types/product";

interface NavbarProps {
  siteConfig: SiteConfig;
}

export default function Navbar({ siteConfig }: Readonly<NavbarProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const count = useStore(cartCount);

  useEffect(() => {
    // Avoid synchronous setState inside effect body (can cause cascading renders warnings).
    queueMicrotask(() => {
      setIsClient(true);
    });
    initializeCart();
  }, []);

  return (
    <nav className="site-navbar sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex shrink-0 items-center">
              <a href="/" className="text-primary text-xl font-bold">
                {siteConfig.name}
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href="/"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium opacity-90 hover:border-current hover:opacity-100"
              >
                Home
              </a>
              <a
                href="/shop"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium opacity-90 hover:border-current hover:opacity-100"
              >
                Shop
              </a>
              <a
                href="/cart"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium opacity-90 hover:border-current hover:opacity-100"
              >
                Cart
              </a>
            </div>
          </div>

          {/* Cart Icon */}
          <div className="flex items-center">
            <button
              onClick={toggleCart}
              className="nav-icon-btn focus:ring-primary relative rounded-md p-2 focus:ring-2 focus:outline-none focus:ring-inset"
              aria-label="Open shopping cart"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {isClient && count > 0 && (
                <span className="bg-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
                  {count.toString()}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="nav-icon-btn focus:ring-primary inline-flex items-center justify-center rounded-md p-2 focus:ring-2 focus:outline-none focus:ring-inset"
              aria-label="Toggle mobile menu"
            >
              <svg
                className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="space-y-1 pt-2 pb-3">
          <a
            href="/"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium opacity-90 hover:border-current hover:opacity-100"
          >
            Home
          </a>
          <a
            href="/shop"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium opacity-90 hover:border-current hover:opacity-100"
          >
            Shop
          </a>
          <a
            href="/cart"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium opacity-90 hover:border-current hover:opacity-100"
          >
            Cart
          </a>
        </div>
      </div>
    </nav>
  );
}
