import { defineMiddleware } from "astro:middleware";

function parseAccessJwtEmail(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Protect all admin routes
  if (pathname.startsWith("/admin")) {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === "development";

    if (isDevelopment) {
      // In development, bypass Cloudflare Access and create a mock user
      console.log("🔓 Development mode: Bypassing Cloudflare Access authentication");
      context.locals.user = {
        email: "dev@localhost",
        jwt: "dev-jwt-token",
        isDevelopment: true,
      };
    } else {
      // In production, use Cloudflare Access
      // Headers are injected on traditional Access; cookie is used for workers.dev one-click Access
      const cfAccessJwt =
        context.request.headers.get("cf-access-jwt-assertion") ??
        context.cookies.get("CF_Authorization")?.value;
      const cfAccessEmail = context.request.headers.get("cf-access-user-email") ??
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

  return next();
});
