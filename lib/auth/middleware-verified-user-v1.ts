/**
 * Same-request verified-user stamp from edge middleware → route handlers.
 *
 * Middleware ALWAYS overwrites this header (empty when anonymous).
 * Clients cannot spoof it. Routes must still load profile authorization
 * (account_status / role) and fail closed on suspended/deleted.
 *
 * This is NOT a substitute for getUser() when the stamp is missing.
 */

export const ROVEXO_VERIFIED_USER_HEADER = "x-rovexo-verified-user";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MiddlewareVerifiedUser = {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
};

export type MiddlewareVerifiedUserState =
  | { kind: "missing" }
  | { kind: "anonymous" }
  | { kind: "user"; user: MiddlewareVerifiedUser };

type StampPayload = {
  id: string;
  email?: string | null;
  emailConfirmedAt?: string | null;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(raw: string): string {
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function encodeJson(value: StampPayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeJson(raw: string): StampPayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as StampPayload;
    if (!parsed || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function encodeMiddlewareVerifiedUser(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
} | null): string {
  if (!user?.id || !UUID_RE.test(user.id)) return "";
  return encodeJson({
    id: user.id,
    email: user.email ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  });
}

export function readMiddlewareVerifiedUserState(
  headerList: Headers,
): MiddlewareVerifiedUserState {
  const raw = headerList.get(ROVEXO_VERIFIED_USER_HEADER);
  if (raw === null) return { kind: "missing" };
  if (raw.trim() === "") return { kind: "anonymous" };

  const parsed = decodeJson(raw.trim());
  if (!parsed?.id || !UUID_RE.test(parsed.id)) {
    return { kind: "missing" };
  }

  return {
    kind: "user",
    user: {
      id: parsed.id,
      email: typeof parsed.email === "string" ? parsed.email : null,
      emailConfirmedAt:
        typeof parsed.emailConfirmedAt === "string" ? parsed.emailConfirmedAt : null,
    },
  };
}

/** Public surfaces that must not pay for MFA network work. */
export function shouldSkipMfaNetworkWork(pathname: string, method: string): boolean {
  const normalized = pathname.split("?")[0] ?? pathname;
  const verb = method.toUpperCase();

  if (normalized === "/" || normalized === "/browse" || normalized === "/search") {
    return true;
  }
  if (normalized === "/listing" || normalized.startsWith("/listing/")) return true;
  if (normalized.startsWith("/user/") || normalized.startsWith("/@")) return true;
  if (normalized === "/api/homepage/feed" || normalized.startsWith("/api/homepage/")) {
    return true;
  }
  if (normalized === "/api/platform/registered-user-count") return true;
  if (normalized === "/api/analytics/live-presence" && (verb === "POST" || verb === "GET")) {
    return true;
  }

  return false;
}
