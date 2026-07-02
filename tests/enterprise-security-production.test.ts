import { describe, expect, it, vi } from "vitest";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";
import { validatePlatformSecuritySurface, validateProductionEnvironment } from "@/lib/ops/production-env";
import { buildSecurityHeaders, validateSecurityHeaderConfiguration } from "@/lib/ops/security-headers";

describe("enterprise security headers", () => {
  it("includes CSP and HSTS in production", () => {
    const headers = buildSecurityHeaders(true);
    const keys = headers.map((header) => header.key);
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("Strict-Transport-Security");
    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("Cross-Origin-Opener-Policy");
  });

  it("validates production header configuration", () => {
    const result = validateSecurityHeaderConfiguration(true);
    expect(result.pass).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});

describe("production environment validation", () => {
  it("returns structured environment report", () => {
    const report = validateProductionEnvironment();
    expect(report.items.length).toBeGreaterThan(10);
    expect(typeof report.pass).toBe("boolean");
    expect(Array.isArray(report.missingRequired)).toBe(true);
    expect(typeof report.timestamp).toBe("string");
  });

  it("validates platform security surface", () => {
    const surface = validatePlatformSecuritySurface();
    expect(surface.checks.some((check) => check.id === "csrf-guard" && check.pass)).toBe(true);
    expect(surface.checks.some((check) => check.id === "stripe-webhook" && check.pass)).toBe(true);
    expect(surface.pass).toBe(true);
  });
});

describe("csrf origin guard", () => {
  it("allows same-origin POST requests in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    const request = new Request("http://localhost:3000/api/demo", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });

    expect(validateMutationOrigin(request)).toBeNull();
    vi.unstubAllEnvs();
  });

  it("blocks cross-origin POST requests in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");

    const request = new Request("https://www.rovexo.co.uk/api/demo", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });

    const blocked = validateMutationOrigin(request);
    expect(blocked?.status).toBe(403);
    vi.unstubAllEnvs();
  });
});
