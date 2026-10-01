import type { AdminIdentity } from "./types";

function parseAccessJwtEmail(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payloadB64 = token.split(".").at(1);
    if (payloadB64 === undefined || payloadB64 === "") return null;
    const parsed: unknown = JSON.parse(atob(payloadB64));
    if (parsed === null || typeof parsed !== "object" || !("email" in parsed)) {
      return null;
    }
    const { email } = parsed as { email?: unknown };
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

/** Cloudflare Access identity from the request. Does not read Worker bindings. */
export function getCloudflareAdminIdentity(
  request: Request,
): (AdminIdentity & { jwt: string }) | null {
  const jwt =
    request.headers.get("cf-access-jwt-assertion") ?? accessCookie(request);
  const email =
    request.headers.get("cf-access-user-email") ?? parseAccessJwtEmail(jwt);
  if (!jwt || !email) return null;
  return { email, jwt };
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
