import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMO_EMAIL_DOMAIN,
  DEMO_LISTING_TARGET,
  DEMO_USERS,
  isDemoSeedEnabled,
  resolveDemoSeedPassword,
} from "@/lib/demo-environment/config";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Demo Testing Environment", () => {
  it("defines 12 canonical demo accounts including permanent Full Demo Accounts", () => {
    expect(DEMO_USERS).toHaveLength(12);
    const [buyer, seller, ...rest] = DEMO_USERS;
    expect(buyer?.email).toBe("demo.buyer@rovexo.co.uk");
    expect(buyer?.password).toBe("RovexoBuyer@2026");
    expect(seller?.email).toBe("demo.seller@rovexo.co.uk");
    expect(seller?.password).toBe("RovexoSeller@2026");
    expect(rest.every((user) => user.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`))).toBe(true);
    expect(DEMO_USERS.map((user) => user.key)).toEqual([
      "live-buyer",
      "live-seller",
      "buyer01",
      "buyer02",
      "seller01",
      "seller02",
      "seller03",
      "seller04",
      "business01",
      "business02",
      "admin",
      "superadmin",
    ]);
  });

  it("uses real Supabase admin auth patterns without mocked permissions", () => {
    const users = readSource("lib/demo-environment/users.ts");
    expect(users).toContain("auth.admin.createUser");
    expect(users).toContain("bootstrap_demo_platform_role");
    expect(users).toContain("verified: true");
    expect(users).not.toContain("MOCK_");
  });

  it("targets 300+ demo listings and marketplace data seeders", () => {
    expect(DEMO_LISTING_TARGET).toBeGreaterThanOrEqual(300);
    const listings = readSource("lib/demo-environment/listings.ts");
    const marketplace = readSource("lib/demo-environment/marketplace.ts");
    expect(listings).toContain('status: "published"');
    expect(marketplace).toContain("orders");
    expect(marketplace).toContain("conversations");
    expect(marketplace).toContain("wallet_transactions");
    expect(marketplace).toContain("saved_items");
    expect(marketplace).toContain("reviews");
  });

  it("ships seed and verify CLI scripts", () => {
    expect(readSource("scripts/seed-demo-environment.ts")).toContain("runDemoEnvironmentSeed");
    expect(readSource("scripts/verify-demo-environment.ts")).toContain("runDemoEnvironmentVerification");
    expect(readSource("package.json")).toContain('"seed:demo"');
    expect(readSource("package.json")).toContain('"verify:demo"');
  });

  it("includes demo bootstrap migration for staff roles", () => {
    const migration = readSource("supabase/migrations/20250723000001_demo_environment_bootstrap.sql");
    expect(migration).toContain("bootstrap_demo_platform_role");
    expect(migration).toContain("rovexo.bypass_role_guard");
  });

  it("allows verified sync during admin user creation", () => {
    const migration = readSource("supabase/migrations/20250723000002_fix_verified_sync_bypass.sql");
    expect(migration).toContain("prevent_profile_verified_escalation");
    expect(migration).toContain("handle_user_email_confirmed");
  });

  it("defaults demo password from env override", () => {
    expect(resolveDemoSeedPassword()).toBeTruthy();
    expect(typeof isDemoSeedEnabled()).toBe("boolean");
  });

  it("treats Vercel CLI Sensitive redaction as unusable (not a missing Production secret)", async () => {
    const { isUnusableEnvSecret, hasDemoEnvironmentConfig, hasDemoPublicConfig } = await import(
      "@/lib/demo-environment/guards"
    );
    expect(isUnusableEnvSecret("[SENSITIVE]")).toBe(true);
    expect(isUnusableEnvSecret("placeholder")).toBe(true);
    expect(isUnusableEnvSecret("sb_secret_example_not_real")).toBe(false);

    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const prevService = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "[SENSITIVE]";
      expect(hasDemoEnvironmentConfig()).toBe(false);
      expect(hasDemoPublicConfig()).toBe(true);
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      if (prevAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevAnon;
      if (prevService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prevService;
    }
  });
});
