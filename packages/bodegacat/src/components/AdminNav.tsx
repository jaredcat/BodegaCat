import { useState } from "react";

export type AdminNavPage =
  | "dashboard"
  | "products"
  | "new"
  | "settings"
  | "product-types"
  | "edit";

interface AdminNavProps {
  readonly currentPage?: AdminNavPage;
  /**
   * From `getProducts({ includeUnpublished: true })` + `hasUnpublishedDrafts`.
   * When true, links go to `/preview` (SSR, staff-only) so drafts are visible.
   */
  readonly hasUnpublishedProducts?: boolean;
}

export default function AdminNav({
  currentPage = "dashboard",
  hasUnpublishedProducts = false,
}: Readonly<AdminNavProps>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const viewStorefrontHref = hasUnpublishedProducts ? "/preview" : "/";
  const viewLiveHref = "/";

  const navItems: {
    href: string;
    label: string;
    icon: string;
    page: AdminNavPage | null;
  }[] = [
    { href: "/admin", label: "Dashboard", icon: "📊", page: "dashboard" },
    { href: "/admin/products", label: "Products", icon: "📦", page: "products" },
    {
      href: "/admin/products/new",
      label: "Add Product",
      icon: "➕",
      page: "new",
    },
    {
      href: "/admin/product-types",
      label: "Product types",
      icon: "🏷️",
      page: "product-types",
    },
    { href: "/admin/settings", label: "Settings", icon: "⚙️", page: "settings" },
    {
      href: viewStorefrontHref,
      label: hasUnpublishedProducts
        ? "View storefront (drafts)"
        : "View storefront",
      icon: "🏪",
      page: null,
    },
  ];

  const isActive = (page: AdminNavPage | null) =>
    page !== null && currentPage === page;

  const linkClass = (page: AdminNavPage | null) =>
    `inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
      isActive(page)
        ? "border-primary text-gray-900"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
    }`;

  const mobileLinkClass = (page: AdminNavPage | null) =>
    `block border-l-4 py-2 pr-4 pl-3 text-base font-medium ${
      isActive(page)
        ? "bg-primary-50 border-primary text-primary-700"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
    }`;

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex min-w-0 flex-1">
            <div className="flex shrink-0 items-center">
              <span className="text-xl font-bold text-gray-900">
                Admin Panel
              </span>
            </div>

            <div className="hidden min-w-0 sm:ml-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 lg:gap-x-6">
              {navItems.map((item) => (
                <a
                  key={item.href + item.label}
                  href={item.href}
                  className={linkClass(item.page)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </a>
              ))}
              {hasUnpublishedProducts && (
                <a href={viewLiveHref} className={linkClass(null)}>
                  <span className="mr-2">👤</span>
                  View live (customers)
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="focus:ring-primary inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:outline-none focus:ring-inset"
            >
              <span className="sr-only">Open main menu</span>
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

      <div className={`${isMobileMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="space-y-1 pt-2 pb-3">
          {navItems.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              className={mobileLinkClass(item.page)}
              onClick={() => {
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </a>
          ))}
          {hasUnpublishedProducts && (
            <a
              href={viewLiveHref}
              className={mobileLinkClass(null)}
              onClick={() => {
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="mr-2">👤</span>
              View live (customers)
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
