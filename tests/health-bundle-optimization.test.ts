import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("health runtime bundle isolation", () => {
  it("keeps health route on the lightweight runtime module", () => {
    const route = readFileSync(join(process.cwd(), "app/api/health/route.ts"), "utf8");
    expect(route).toContain("@/lib/ops/health-runtime");
    expect(route).not.toContain("@/lib/stripe/server");
    expect(route).not.toMatch(/from "@\/lib\/ops\/logger"/);
    expect(route).toContain('"@/lib/ops/production-env"');
    expect(route).toContain('await import');
    expect(route).toContain('"@/lib/ops/logger"');
  });

  it("avoids Stripe SDK in health runtime", () => {
    const runtime = readFileSync(join(process.cwd(), "lib/ops/health-runtime.ts"), "utf8");
    expect(runtime).not.toContain("@/lib/stripe/server");
    expect(runtime).not.toContain('from "stripe"');
    expect(runtime).toContain("api.stripe.com/v1/balance");
  });

  it("does not import admin client barrel in health runtime", () => {
    const runtime = readFileSync(join(process.cwd(), "lib/ops/health-runtime.ts"), "utf8");
    expect(runtime).not.toContain("@/lib/supabase/admin");
    expect(runtime).toContain("@supabase/supabase-js");
  });

  it("exposes diagnostics on a separate route", () => {
    const diagnostics = readFileSync(join(process.cwd(), "app/api/health/diagnostics/route.ts"), "utf8");
    expect(diagnostics).toContain("validateProductionEnvironment");
    expect(diagnostics).toContain("validatePlatformSecuritySurface");
  });
});
