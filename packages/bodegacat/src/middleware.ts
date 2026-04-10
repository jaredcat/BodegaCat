import { defineMiddleware } from "astro:middleware";
import type { APIContext } from "astro";
import { BODEGACAT_ADMIN_LOCAL_BYPASS } from "astro:env/server";

function parseAccessJwtEmail(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payloadB64 = token.split(".").at(1);
    if (payloadB64 === undefined || payloadB64 === "") return null;
    const parsed: unknown = JSON.parse(atob(payloadB64));
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      !("email" in parsed)
    ) {
      return null;
    }
    const { email } = parsed as { email?: unknown };
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

/** `BODEGACAT_ADMIN_LOCAL_BYPASS=true` + loopback only — for `wrangler dev` on built output. */
function isAdminLocalPreviewBypass(
  context: APIContext,
  bypassRaw: string | undefined,
): boolean {
  if (bypassRaw !== "true" && bypassRaw !== "1") {
    return false;
  }
  return isLoopbackHostname(context.url.hostname);
}

/**
 * Staff-only routes: admin UI, draft preview, and admin APIs.
 * Public APIs (`/api/stripe-webhook`, checkout, etc.) stay unauthenticated here.
 */
function requiresStaffAccess(pathname: string): boolean {
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname === "/preview" || pathname.startsWith("/preview/")) return true;
  return false;
}

/** Authenticated draft preview catalog (includes unpublished products). */
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
    } else if (isAdminLocalPreviewBypass(context, BODEGACAT_ADMIN_LOCAL_BYPASS)) {
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
      const cfAccessJwt =
        context.request.headers.get("cf-access-jwt-assertion") ??
        context.cookies.get("CF_Authorization")?.value;
      const cfAccessEmail =
        context.request.headers.get("cf-access-user-email") ??
        parseAccessJwtEmail(cfAccessJwt);

      if (!cfAccessJwt || !cfAccessEmail) {
        return new Response("Unauthorized", { status: 403 });
      }

      context.locals.user = {
        email: cfAccessEmail,
        jwt: cfAccessJwt,
        isDevelopment: false,
      };
    }
  }

  if (isPreviewCatalogPath(pathname)) {
    context.locals.storefrontPreview = true;
  }

  return next();
});
