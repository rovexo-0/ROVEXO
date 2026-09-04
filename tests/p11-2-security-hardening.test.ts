import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  API_CSRF_EXEMPT_PREFIXES,
  API_PERIMETER_SECURITY_V1,
  enforceApiPerimeterSecurity,
  isApiCsrfExempt,
} from "@/lib/api/api-perimeter-security-v1";
import { buildSecurityHeaders, CSP_RESIDUAL_JUSTIFICATIONS } from "@/lib/ops/security-headers";
import { NextRequest } from "next/server";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("P11.2 security hardening", () => {
  it("exposes API perimeter SSOT with webhook/cron CSRF exemptions", () => {
    expect(API_PERIMETER_SECURITY_V1.version).toBe("p11.2-v1");
    expect(API_PERIMETER_SECURITY_V1.sensitiveRateRuleCount).toBeGreaterThanOrEqual(20);
    expect(isApiCsrfExempt("/api/webhooks/stripe")).toBe(true);
    expect(isApiCsrfExempt("/api/stripe/webhook")).toBe(true);
    expect(isApiCsrfExempt("/api/cron/maintenance")).toBe(true);
    expect(isApiCsrfExempt("/api/wallet/withdraw")).toBe(false);
    expect(API_CSRF_EXEMPT_PREFIXES.length).toBeGreaterThanOrEqual(3);
  });

  it("middleware wires API perimeter security", () => {
    const src = read("lib/supabase/middleware.ts");
    expect(src).toContain("enforceApiPerimeterSecurity");
  });

  it("blocks cross-origin mutations via perimeter CSRF", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.rovexo.co.uk");

    // Path outside sensitive rate-limit prefixes so this asserts CSRF only.
    const evil = new Request("https://www.rovexo.co.uk/api/trust", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    const blocked = await enforceApiPerimeterSecurity(evil as unknown as NextRequest);
    expect(blocked?.status).toBe(403);

    const webhook = new Request("https://www.rovexo.co.uk/api/webhooks/stripe", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(await enforceApiPerimeterSecurity(webhook as unknown as NextRequest)).toBeNull();

    vi.unstubAllEnvs();
  });

  it("CSP has no unsafe-eval, object-src none, upgrade-insecure-requests", () => {
    const csp = buildSecurityHeaders(true).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(CSP_RESIDUAL_JUSTIFICATIONS["script-src 'unsafe-inline'"]).toMatch(/REQUIRED/);
    expect(CSP_RESIDUAL_JUSTIFICATIONS["Cross-Origin-Embedder-Policy"]).toMatch(/OMITTED/);
  });

  it("production config keeps source maps disabled", () => {
    expect(read("next.config.ts")).toContain("productionBrowserSourceMaps: false");
    expect(read("next.config.ts")).toContain("poweredByHeader: false");
  });

  it("pins Next to patched 16.3.0 in package.json", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
      overrides: Record<string, string>;
    };
    expect(pkg.dependencies.next).toBe("16.3.0");
    expect(pkg.overrides.undici).toContain("7.29");
    expect(pkg.overrides.sharp).toContain("0.35");
  });
});
