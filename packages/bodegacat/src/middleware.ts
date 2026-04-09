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

const STOREFRONT_PREVIEW_COOKIE = "bodegacat_storefront_preview";

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

function isStorefrontCatalogPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  return pathname === "/shop" || pathname.startsWith("/shop/");
}

/** Cloudflare Access identity in production, or null for anonymous visitors. */
function getOptionalProductionAccessUser(
  context: APIContext,
): { email: string; jwt: string } | null {
  const cfAccessJwt =
    context.request.headers.get("cf-access-jwt-assertion") ??
    context.cookies.get("CF_Authorization")?.value;
  const cfAccessEmail =
    context.request.headers.get("cf-access-user-email") ??
    parseAccessJwtEmail(cfAccessJwt);

  if (!cfAccessJwt || !cfAccessEmail) {
    return null;
  }

  return { email: cfAccessEmail, jwt: cfAccessJwt };
}

function applyStorefrontPreviewCookie(
  context: APIContext,
  previewParam: string | null,
): void {
  if (previewParam === "1" || previewParam === "true") {
    context.cookies.set(STOREFRONT_PREVIEW_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
    });
  }
}

function applyStorefrontPreviewCookieProd(
  context: APIContext,
  previewParam: string | null,
): void {
  if (previewParam === "1" || previewParam === "true") {
    context.cookies.set(STOREFRONT_PREVIEW_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 8,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }
}

/** Sets locals.user and optional preview cookie when preview mode is active. */
function resolveStorefrontPreview(
  context: APIContext,
  isDevelopment: boolean,
): boolean {
  const previewParam = context.url.searchParams.get("preview");
  const previewCookie =
    context.cookies.get(STOREFRONT_PREVIEW_COOKIE)?.value ?? null;
  const wantsPreviewSession =
    previewParam === "1" ||
    previewParam === "true" ||
    previewCookie === "1";

  if (previewParam === "0" || previewParam === "false") {
    context.cookies.delete(STOREFRONT_PREVIEW_COOKIE, { path: "/" });
  }

  if (isDevelopment) {
    if (!wantsPreviewSession) {
      return false;
    }
    context.locals.user = {
      email: "dev@localhost",
      jwt: "dev-jwt-token",
      isDevelopment: true,
    };
    applyStorefrontPreviewCookie(context, previewParam);
    return true;
  }

  const accessUser = getOptionalProductionAccessUser(context);
  if (!accessUser || !wantsPreviewSession) {
    return false;
  }

  context.locals.user = {
    email: accessUser.email,
    jwt: accessUser.jwt,
    isDevelopment: false,
  };
  applyStorefrontPreviewCookieProd(context, previewParam);
  return true;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.NODE_ENV === "development";

  // Protect all admin routes
  if (pathname.startsWith("/admin")) {
    if (isDevelopment) {
      // In development, bypass Cloudflare Access and create a mock user
      console.log("🔓 Development mode: Bypassing Cloudflare Access authentication");
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
      // In production, use Cloudflare Access
      // Headers are injected on traditional Access; cookie is used for workers.dev one-click Access
      const cfAccessJwt =
        context.request.headers.get("cf-access-jwt-assertion") ??
        context.cookies.get("CF_Authorization")?.value;
      const cfAccessEmail =
        context.request.headers.get("cf-access-user-email") ??
        parseAccessJwtEmail(cfAccessJwt);

      if (!cfAccessJwt || !cfAccessEmail) {
        return new Response("Unauthorized", { status: 403 });
      }

      // Add user info to context for use in admin pages
      context.locals.user = {
        email: cfAccessEmail,
        jwt: cfAccessJwt,
        isDevelopment: false,
      };
    }
  }

  if (isStorefrontCatalogPath(pathname)) {
    if (resolveStorefrontPreview(context, isDevelopment)) {
      context.locals.storefrontPreview = true;
    }
  }

  return next();
});
