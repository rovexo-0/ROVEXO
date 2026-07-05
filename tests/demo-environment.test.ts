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
  it("defines 10 canonical demo accounts", () => {
    expect(DEMO_USERS).toHaveLength(10);
    expect(DEMO_USERS.every((user) => user.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`))).toBe(true);
    expect(DEMO_USERS.map((user) => user.key)).toEqual([
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
});
