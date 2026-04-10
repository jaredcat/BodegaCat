import type { APIRoute } from "astro";

export const prerender = false;

const STOREFRONT_PREVIEW_COOKIE = "bodegacat_storefront_preview";

/** Clears the storefront preview cookie (must match middleware set/delete options). */
export const POST: APIRoute = ({ cookies }) => {
  const isDevelopment =
    import.meta.env.DEV || import.meta.env.NODE_ENV === "development";

  if (isDevelopment) {
    cookies.delete(STOREFRONT_PREVIEW_COOKIE, { path: "/" });
  } else {
    cookies.delete(STOREFRONT_PREVIEW_COOKIE, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }

  return new Response(null, { status: 204 });
};
