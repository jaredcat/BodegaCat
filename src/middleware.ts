import { defineMiddleware } from "astro:middleware";

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
      const cfAccessJwt = context.request.headers.get("cf-access-jwt-assertion");
      const cfAccessEmail = context.request.headers.get("cf-access-user-email");

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
