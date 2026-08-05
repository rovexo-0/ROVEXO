import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSecurityHeaders, CSP_RESIDUAL_JUSTIFICATIONS } from "@/lib/ops/security-headers";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("P11.1 security hardening", () => {
  it("gates all marketplace-os routes behind super_admin guard", () => {
    for (const route of ["alerts", "health", "audit", "status"]) {
      const src = read(`app/api/marketplace-os/${route}/route.ts`);
      expect(src).toContain("requireMarketplaceOsAccess");
    }
    expect(read("lib/marketplace-os/api-guard-v1.ts")).toContain("requireApiSuperAdmin");
  });

  it("adds orders/messages UPDATE least-privilege migration", () => {
    const migration = read(
      "supabase/migrations/20260805010000_p11_1_orders_messages_update_least_privilege.sql",
    );
    expect(migration).toContain("orders_update_admin");
    expect(migration).toContain("messages_update_sender");
    expect(migration).toContain('drop policy if exists "orders_update_participant"');
  });

  it("removes unsafe-eval and documents residual unsafe-inline", () => {
    const csp = buildSecurityHeaders(true).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("unsafe-inline");
    expect(CSP_RESIDUAL_JUSTIFICATIONS["script-src 'unsafe-eval'"]).toContain("REMOVED");
  });

  it("strips public health secret inventory", () => {
    const health = read("app/api/health/route.ts");
    expect(health).not.toContain("missingEnv");
    expect(health).not.toContain("validateProductionEnvironment");
    expect(read("app/api/health/diagnostics/route.ts")).toContain("requireApiSuperAdmin");
  });

  it("wires CSRF on money and offer mutations", () => {
    expect(read("app/api/checkout/buy-now/route.ts")).toContain("requireApiAuth(request)");
    expect(read("app/api/wallet/withdraw/route.ts")).toContain("requireApiAuth(request)");
    expect(read("app/api/offers/route.ts")).toContain("validateMutationOrigin");
    expect(read("app/api/offers/[id]/route.ts")).toContain("validateMutationOrigin");
  });

  it("binds message senderRole server-side", () => {
    const src = read("app/api/messages/[id]/route.ts");
    expect(src).toContain("getViewerRole");
    expect(src).not.toMatch(/senderRole:\s*body\.senderRole/);
  });

  it("middleware treats marketplace-os as super-admin API", () => {
    expect(read("lib/supabase/middleware.ts")).toContain("/api/marketplace-os/");
  });
});
