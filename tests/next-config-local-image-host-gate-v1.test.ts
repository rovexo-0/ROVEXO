/**
 * #45 — Production must never allow local Supabase (127.0.0.1:54321)
 * as an images.remotePatterns host. Local/LAN remains gated by !isProduction.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PRODUCTION_IMAGE_HOST = "pklotmwxtnnepaitedic.supabase.co";
const PRODUCTION_SUPABASE_URL = `https://${PRODUCTION_IMAGE_HOST}`;
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

type RemotePattern = {
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
};

async function loadNextConfig(
  nodeEnv: "development" | "production",
  supabaseUrl = PRODUCTION_SUPABASE_URL,
): Promise<NextConfig> {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  vi.stubEnv("SUPABASE_URL", supabaseUrl);
  const mod = await import("../next.config.ts");
  return mod.default as NextConfig;
}

function remotePatterns(config: NextConfig): RemotePattern[] {
  return (config.images && "remotePatterns" in config.images
    ? config.images.remotePatterns
    : []) as RemotePattern[];
}

function isLocalLoopbackPattern(pattern: RemotePattern): boolean {
  const host = (pattern.hostname ?? "").toLowerCase();
  return (
    host === "127.0.0.1" ||
    host === "localhost" ||
    host === "::1" ||
    (pattern.port === "54321" && (host === "127.0.0.1" || host === "localhost"))
  );
}

function isPrivateLanHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "127.0.0.1" || host === "localhost" || host === "::1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  const rfc1918 = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(host);
  if (!rfc1918) return false;
  const second = Number(rfc1918[1]);
  return second >= 16 && second <= 31;
}

describe("next.config local image host gate", () => {
  it("A — development allows http://127.0.0.1:54321 and dangerouslyAllowLocalIP", async () => {
    const config = await loadNextConfig("development", LOCAL_SUPABASE_URL);
    const patterns = remotePatterns(config);
    expect(
      patterns.some(
        (pattern) =>
          pattern.protocol === "http" &&
          pattern.hostname === "127.0.0.1" &&
          pattern.port === "54321",
      ),
    ).toBe(true);
    expect(config.images && "dangerouslyAllowLocalIP" in config.images
      ? config.images.dangerouslyAllowLocalIP
      : false).toBe(true);
  });

  it("B — Production remotePatterns omit 127.0.0.1:54321", async () => {
    const config = await loadNextConfig("production");
    expect(remotePatterns(config).some(isLocalLoopbackPattern)).toBe(false);
  });

  it("C — Production keeps canonical https image hosts", async () => {
    const config = await loadNextConfig("production");
    const patterns = remotePatterns(config);
    expect(
      patterns.some(
        (pattern) =>
          pattern.protocol === "https" && pattern.hostname === PRODUCTION_IMAGE_HOST,
      ),
    ).toBe(true);
    expect(
      patterns.some(
        (pattern) => pattern.protocol === "https" && pattern.hostname === "api.dicebear.com",
      ),
    ).toBe(true);
  });

  it("D — Production does not enable dangerouslyAllowLocalIP", async () => {
    const config = await loadNextConfig("production");
    expect(
      config.images && "dangerouslyAllowLocalIP" in config.images
        ? config.images.dangerouslyAllowLocalIP
        : undefined,
    ).not.toBe(true);
  });

  it("E — Production rewrites do not proxy :54321", async () => {
    const config = await loadNextConfig("production");
    const rewrites = config.rewrites;
    expect(typeof rewrites).toBe("function");
    const resolved = await (rewrites as () => Promise<unknown> | unknown)();
    const list = Array.isArray(resolved)
      ? resolved
      : [
          ...((resolved as { beforeFiles?: unknown[] })?.beforeFiles ?? []),
          ...((resolved as { afterFiles?: unknown[] })?.afterFiles ?? []),
          ...((resolved as { fallback?: unknown[] })?.fallback ?? []),
        ];
    expect(
      list.some((entry) => {
        const destination = String((entry as { destination?: string }).destination ?? "");
        return (
          destination.includes(":54321") ||
          destination.includes("127.0.0.1") ||
          destination.includes("localhost:54321")
        );
      }),
    ).toBe(false);
  });

  it("F — Production rejects loopback even if env points at local Supabase", async () => {
    const config = await loadNextConfig("production", LOCAL_SUPABASE_URL);
    const patterns = remotePatterns(config);
    expect(patterns.some(isLocalLoopbackPattern)).toBe(false);
    expect(patterns.some((pattern) => isPrivateLanHostname(pattern.hostname ?? ""))).toBe(false);
    expect(
      patterns.some(
        (pattern) =>
          pattern.protocol === "https" && pattern.hostname === PRODUCTION_IMAGE_HOST,
      ),
    ).toBe(true);
  });

  it("source keeps local image + rewrite hosts behind !isProduction", () => {
    const source = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(source).toContain('hostname: "127.0.0.1"');
    expect(source).toContain('port: "54321"');
    expect(source).toContain("...(!isProduction");
    expect(source).toContain("dangerouslyAllowLocalIP: true");
    expect(source).toContain("if (!isProduction)");
    expect(source).toContain("/rovexo-local-storage/:path*");
    expect(source).toContain("http://127.0.0.1:54321/:path*");
    expect(source).toContain("allowedDevOrigins");
  });
});
