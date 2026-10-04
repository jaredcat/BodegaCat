import type { AdminIdentity } from "./types";

function parseAccessJwtEmail(token: string | undefined): string | undefined {
  if (!token) return undefined;
  try {
    const payloadB64 = token.split(".", 2).at(1);
    if (payloadB64 === undefined || payloadB64 === "") return undefined;
    const parsed: unknown = JSON.parse(atob(payloadB64));
    // `typeof null === "object"` — reject null via falsiness after the typeof check.
    if (typeof parsed !== "object" || !parsed || !("email" in parsed)) {
      return undefined;
    }
    const { email } = parsed as { email?: unknown };
    return typeof email === "string" ? email : undefined;
  } catch {
    return undefined;
  }
}

/**
Cloudflare Access identity from the request. Does not read Worker bindings.
*/
export function getCloudflareAdminIdentity(
  request: Request,
): (AdminIdentity & { jwt: string }) | undefined {
  const jwt =
    request.headers.get("cf-access-jwt-assertion") ?? accessCookie(request);
  const email =
    request.headers.get("cf-access-user-email") ?? parseAccessJwtEmail(jwt);
  return !jwt || !email ? undefined : { email, jwt };
}

function accessCookie(request: Request): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "CF_Authorization") return rest.join("=");
  }
  return undefined;
}
