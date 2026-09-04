/**
 * PWA Stripe Connect return/refresh origin.
 *
 * Uses the reachable request origin (loopback or LAN/dev-host) so a phone
 * that opened the local PWA via a LAN URL is sent back to that same host.
 * Never invents a Production return URL and never maps one device's
 * localhost onto another machine.
 */

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export function normalizeAppOriginCandidate(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return stripTrailingSlash(url.origin);
  } catch {
    return null;
  }
}

export function isLocalDevelopmentAppOrigin(raw: string): boolean {
  const origin = normalizeAppOriginCandidate(raw);
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") {
      return true;
    }
    if (host.endsWith(".local")) return true;
    if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true;
    if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

export function refererOrigin(referer: string | null | undefined): string | null {
  const trimmed = referer?.trim();
  if (!trimmed) return null;
  try {
    return stripTrailingSlash(new URL(trimmed).origin);
  } catch {
    return null;
  }
}

/**
 * Prefer the origin the PWA is actually being used from.
 * Production www.rovexo.co.uk is used only when the request itself is that origin
 * (or as last-resort fallbackBase). Local/LAN requests never rewrite to Production.
 */
export function resolveBusinessConnectAppBase(input: {
  originHeader?: string | null;
  refererHeader?: string | null;
  runtimeOrigin?: string | null;
  fallbackBase: string;
}): string {
  const fallback = normalizeAppOriginCandidate(input.fallbackBase) ?? stripTrailingSlash(input.fallbackBase);

  // Vercel Production: ignore spoofed loopback/LAN Origin/Referer.
  if (process.env.VERCEL_ENV === "production") {
    return fallback;
  }

  const candidates = [
    normalizeAppOriginCandidate(input.originHeader),
    refererOrigin(input.refererHeader),
    normalizeAppOriginCandidate(input.runtimeOrigin),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (isLocalDevelopmentAppOrigin(candidate)) return candidate;
  }

  if (isLocalDevelopmentAppOrigin(fallback)) return fallback;

  const requestOrigin = normalizeAppOriginCandidate(input.originHeader);
  if (requestOrigin && requestOrigin === fallback) return fallback;

  return fallback;
}
