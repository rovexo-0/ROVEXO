import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * ROVEXO SSRF Guard v1.0 — Production security hardening.
 * Blocks private/metadata destinations before server-side outbound fetch.
 */

export class SsrfBlockedError extends Error {
  readonly code = "SSRF_BLOCKED" as const;

  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "kubernetes",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

const CLOUD_METADATA_HOSTS = new Set([
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.goog",
]);

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return null;
  }
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n == null) return true;
  // 0.0.0.0/8
  if ((n >>> 24) === 0) return true;
  // 10.0.0.0/8
  if ((n >>> 24) === 10) return true;
  // 127.0.0.0/8
  if ((n >>> 24) === 127) return true;
  // 169.254.0.0/16 link-local / cloud metadata
  if ((n >>> 16) === 0xa9fe) return true;
  // 172.16.0.0/12
  if ((n >>> 20) === 0xac1) return true;
  // 192.168.0.0/16
  if ((n >>> 16) === 0xc0a8) return true;
  // 100.64.0.0/10 CGNAT
  if ((n >>> 22) === 0x191) return true;
  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80:")) return true; // link-local
  // IPv4-mapped
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isBlockedIpv4(mapped[1]);
  return false;
}

export function isBlockedIpAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true;
}

export type AssertSafeOutboundUrlOptions = {
  /** When set, hostname must match one of these (exact or subdomain). */
  allowedHostSuffixes?: readonly string[];
  allowHttp?: boolean;
};

function hostMatchesAllowlist(hostname: string, suffixes: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return suffixes.some((suffix) => {
    const s = suffix.toLowerCase().replace(/^\./, "");
    return host === s || host.endsWith(`.${s}`);
  });
}

/**
 * Validates URL scheme/host before connect. Call again after redirects.
 */
export function assertSafeOutboundUrlSync(
  rawUrl: string,
  options: AssertSafeOutboundUrlOptions = {},
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("Invalid outbound URL.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol === "file:" || protocol === "ftp:" || protocol === "gopher:" || protocol === "data:") {
    throw new SsrfBlockedError("Outbound protocol is not allowed.");
  }
  if (protocol === "http:") {
    if (!options.allowHttp) {
      throw new SsrfBlockedError("HTTP outbound URLs are not allowed.");
    }
  } else if (protocol !== "https:") {
    throw new SsrfBlockedError("Only HTTPS outbound URLs are allowed.");
  }

  const hostnameRaw = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const hostname =
    hostnameRaw.startsWith("[") && hostnameRaw.endsWith("]")
      ? hostnameRaw.slice(1, -1)
      : hostnameRaw;
  if (!hostname) {
    throw new SsrfBlockedError("Outbound URL hostname is required.");
  }
  if (hostname.includes("%") || hostname.includes("\\")) {
    throw new SsrfBlockedError("Outbound URL hostname is invalid.");
  }
  if (BLOCKED_HOSTNAMES.has(hostname) || CLOUD_METADATA_HOSTS.has(hostname)) {
    throw new SsrfBlockedError("Outbound URL hostname is blocked.");
  }
  if (hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".localhost")) {
    throw new SsrfBlockedError("Internal DNS names are blocked.");
  }

  const ipVersion = isIP(hostname);
  if (ipVersion && isBlockedIpAddress(hostname)) {
    throw new SsrfBlockedError("Private or metadata IP addresses are blocked.");
  }

  if (options.allowedHostSuffixes?.length) {
    if (!hostMatchesAllowlist(hostname, options.allowedHostSuffixes)) {
      throw new SsrfBlockedError("Outbound URL host is not on the allowlist.");
    }
  }

  return parsed;
}

/**
 * Resolves hostname and rejects private/metadata addresses (DNS rebinding guard).
 */
export async function assertSafeOutboundUrl(
  rawUrl: string,
  options: AssertSafeOutboundUrlOptions = {},
): Promise<URL> {
  const parsed = assertSafeOutboundUrlSync(rawUrl, options);
  const hostnameRaw = parsed.hostname.toLowerCase();
  const hostname =
    hostnameRaw.startsWith("[") && hostnameRaw.endsWith("]")
      ? hostnameRaw.slice(1, -1)
      : hostnameRaw;

  if (isIP(hostname)) {
    return parsed;
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfBlockedError("Outbound URL hostname could not be resolved.");
  }

  if (!records.length) {
    throw new SsrfBlockedError("Outbound URL hostname resolved to no addresses.");
  }

  for (const record of records) {
    if (isBlockedIpAddress(record.address)) {
      throw new SsrfBlockedError("Outbound URL resolves to a private or metadata address.");
    }
  }

  return parsed;
}

export type SafeFetchOptions = RequestInit & {
  ssrf?: AssertSafeOutboundUrlOptions;
  maxRedirects?: number;
};

/**
 * fetch() with SSRF validation and redirect re-validation (no silent redirect bypass).
 */
export async function safeFetch(rawUrl: string, init: SafeFetchOptions = {}): Promise<Response> {
  const { ssrf, maxRedirects = 3, redirect: _ignored, ...fetchInit } = init;
  let current = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    await assertSafeOutboundUrl(current, ssrf);
    const response = await fetch(current, {
      ...fetchInit,
      redirect: "manual",
    });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }
    if (hop === maxRedirects) {
      throw new SsrfBlockedError("Too many redirects for outbound fetch.");
    }
    current = new URL(location, current).toString();
  }

  throw new SsrfBlockedError("Outbound fetch failed redirect validation.");
}
