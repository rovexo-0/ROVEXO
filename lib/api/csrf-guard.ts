import { NextResponse } from "next/server";
import { DEFAULT_APP_URL, getAppUrl, isLoopbackAppOrigin } from "@/lib/supabase/env";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeHost(raw: string): string {
  return raw.trim().toLowerCase();
}

function isUnusableHostConfig(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed === "[SENSITIVE]" || trimmed.startsWith("[SEN")) return true;
  if (trimmed.includes("[") || trimmed.includes("]")) return true;
  return false;
}

function tryAddConfiguredOriginHost(hosts: Set<string>, raw: string, allowLoopback: boolean): void {
  if (isUnusableHostConfig(raw)) return;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!allowLoopback && isLoopbackAppOrigin(url.origin)) return;
    hosts.add(normalizeHost(url.host));
  } catch {
    // ignore invalid URL
  }
}

/** Configured public hosts (env) — not the only allow source. */
function configuredHosts(): Set<string> {
  const hosts = new Set<string>();
  const allowLoopbackFromEnv = process.env.NODE_ENV !== "production";

  for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    tryAddConfiguredOriginHost(hosts, raw, allowLoopbackFromEnv);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) tryAddConfiguredOriginHost(hosts, vercel, allowLoopbackFromEnv);

  // Production identity always includes the canonical ROVEXO origin (never loopback).
  if (process.env.NODE_ENV === "production") {
    tryAddConfiguredOriginHost(hosts, getAppUrl(), false);
    tryAddConfiguredOriginHost(hosts, DEFAULT_APP_URL, false);
  }

  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost:3000");
    hosts.add("127.0.0.1:3000");
  }

  return hosts;
}

/**
 * Hosts that are valid for this request:
 * - configured app URLs
 * - the request Host / X-Forwarded-Host (same-origin as the browser hit)
 * - request URL host (fallback when Host header absent, e.g. unit tests)
 *
 * Android / LAN: phone opens http://192.168.x.x:3000 while env lists localhost —
 * Origin matches request Host → PASS. Evil Origin ≠ Host → FAIL.
 */
function allowedHostsForRequest(request: Request): Set<string> {
  const hosts = configuredHosts();

  const hostHeader = request.headers.get("host");
  if (hostHeader) hosts.add(normalizeHost(hostHeader));

  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) hosts.add(normalizeHost(forwarded));

  try {
    hosts.add(normalizeHost(new URL(request.url).host));
  } catch {
    // ignore
  }

  return hosts;
}

function hostFromHeader(value: string | null): string | null {
  if (!value || value === "null") return null;
  try {
    return normalizeHost(new URL(value).host);
  } catch {
    return null;
  }
}

/** Blocks cross-site mutation requests when Origin/Referer do not match the app host. */
export function validateMutationOrigin(request: Request): NextResponse | null {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const hosts = allowedHostsForRequest(request);
  if (hosts.size === 0) {
    return null;
  }

  // Native OkHttp (and other Bearer clients) do not send browser Origin.
  // Cookie-only browser mutations still require Origin/Referer match.
  const authorization = request.headers.get("authorization");
  if (authorization && /^Bearer\s+\S+/i.test(authorization)) {
    return null;
  }

  const originHost = hostFromHeader(request.headers.get("origin"));
  if (originHost && hosts.has(originHost)) {
    return null;
  }

  const refererHost = hostFromHeader(request.headers.get("referer"));
  if (refererHost && hosts.has(refererHost)) {
    return null;
  }

  // Some mobile WebViews omit Origin on same-origin JSON POST; trust Sec-Fetch-Site.
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "same-origin") {
    return null;
  }

  if (!originHost && !refererHost && process.env.NODE_ENV !== "production") {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0-rc.1",
      // User-facing — never expose CSRF/framework internals (fail-closed).
      error: "Unable to complete this action.",
      diagnostics: { guard: "csrf-origin", appUrl: getAppUrl() },
    },
    { status: 403 },
  );
}
