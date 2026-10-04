import { defineMiddleware } from "astro:middleware";
import type { APIContext } from "astro";
import { BODEGACAT_ADMIN_LOCAL_BYPASS } from "astro:env/server";
import { getCloudflareAdminIdentity } from "@runtime/cloudflare-access";

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

/**
`BODEGACAT_ADMIN_LOCAL_BYPASS=true` + loopback only — for `wrangler dev` on built output.
*/
function isAdminLocalPreviewBypass(
  context: APIContext,
  bypassRaw: string | undefined,
): boolean {
  return (
    (bypassRaw === "true" || bypassRaw === "1") &&
    isLoopbackHostname(context.url.hostname)
  );
}

/**
Staff-only routes: admin UI, draft preview, and admin APIs.
Public APIs (`/api/stripe-webhook`, checkout, etc.) stay unauthenticated here.
*/
function requiresStaffAccess(pathname: string): boolean {
  return (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/admin") ||
    pathname === "/preview" ||
    pathname.startsWith("/preview/")
  );
}

/**
Authenticated draft preview catalog (includes unpublished products).
*/
function isPreviewCatalogPath(pathname: string): boolean {
  return (
    pathname === "/preview" ||
    pathname === "/preview/shop" ||
    pathname.startsWith("/preview/shop/")
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.NODE_ENV === "development";

  if (requiresStaffAccess(pathname)) {
    if (isDevelopment) {
      console.log(
        "🔓 Development mode: Bypassing Cloudflare Access authentication",
      );
      context.locals.user = {
        email: "dev@localhost",
        jwt: "dev-jwt-token",
        isDevelopment: true,
      };
    } else if (
      isAdminLocalPreviewBypass(context, BODEGACAT_ADMIN_LOCAL_BYPASS)
    ) {
      console.warn(
        "[bodegacat] BODEGACAT_ADMIN_LOCAL_BYPASS: mock admin (loopback only). Do not set in production.",
      );
      context.locals.user = {
        email: "preview-local@localhost",
        jwt: "local-preview-bypass",
        isDevelopment: false,
        localPreviewBypass: true,
      };
    } else {
      const identity = getCloudflareAdminIdentity(context.request);

      if (!identity) {
        return new Response("Unauthorized", { status: 403 });
      }

      context.locals.user = {
        email: identity.email,
        jwt: identity.jwt,
        isDevelopment: false,
      };
    }
  }

  if (isPreviewCatalogPath(pathname)) {
    context.locals.storefrontPreview = true;
  }

  return next();
});
