/**
 * Phase 2A.1 — lost_parcel_guarantee_events RLS (static migration audit).
 * No database connection.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function src(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const MIGRATION =
  "supabase/migrations/20260831170000_stripe_e2e_canonical_seller_context_v1.sql";

describe("Phase 2A.1 — lost_parcel_guarantee_events RLS", () => {
  const migration = src(MIGRATION);
  const engine = src("lib/resolution-engine/lost-parcel-guarantee-v1.ts");
  const webhookMigration = src(
    "supabase/migrations/20260719120000_wallet_security_certification_v1.sql",
  );
  const walletRls = src("supabase/migrations/20250618000002_rls_policies.sql");

  it("1. creates lost_parcel_guarantee_events", () => {
    expect(migration).toContain("create table if not exists public.lost_parcel_guarantee_events");
  });

  it("2. enables RLS on lost_parcel_guarantee_events", () => {
    expect(migration).toMatch(
      /alter table public\.lost_parcel_guarantee_events\s+enable row level security/i,
    );
  });

  it("3. has no unrestricted policies (no USING (true))", () => {
    const tableStart = migration.indexOf("create table if not exists public.lost_parcel_guarantee_events");
    const cancelStart = migration.indexOf("-- 6. Cancel claim");
    expect(tableStart).toBeGreaterThanOrEqual(0);
    expect(cancelStart).toBeGreaterThan(tableStart);
    const section = migration.slice(tableStart, cancelStart);
    expect(section).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(section).not.toMatch(/with check\s*\(\s*true\s*\)/i);
    expect(section).not.toMatch(/create policy/i);
  });

  it("4. preserves service-role access; revokes anon/authenticated", () => {
    expect(migration).toMatch(
      /revoke all on table public\.lost_parcel_guarantee_events from anon,\s*authenticated/i,
    );
    expect(migration).toMatch(
      /grant all on table public\.lost_parcel_guarantee_events to service_role/i,
    );
  });

  it("5. application access is admin/server-only (createAdminClient)", () => {
    expect(engine).toContain('from("lost_parcel_guarantee_events")');
    expect(engine).toContain("createAdminClient");
    expect(engine).toContain('import "server-only"');
    // No client feature imports of the table
    expect(src("lib/resolution-engine/lost-parcel-guarantee-v1.ts")).not.toContain(
      "createBrowserClient",
    );
  });

  it("6. mirrors stripe_webhook_events service-role posture", () => {
    expect(webhookMigration).toContain(
      "alter table public.stripe_webhook_events enable row level security",
    );
    expect(webhookMigration).toContain(
      "revoke all on table public.stripe_webhook_events from anon, authenticated",
    );
    expect(webhookMigration).toContain(
      "grant all on table public.stripe_webhook_events to service_role",
    );
  });

  it("7. unrelated wallet/order RLS policies remain unchanged in this migration", () => {
    expect(migration).not.toContain("wallets_select_own");
    expect(migration).not.toContain("wallet_transactions_select_own");
    expect(migration).not.toContain("orders_update_admin");
    expect(migration).not.toMatch(/drop policy if exists "wallets_/i);
    // Canonical wallet RLS still lives in foundation RLS migration
    expect(walletRls).toContain("wallets_select_own");
    expect(walletRls).toContain("wallet_transactions_select_own");
  });

  it("8. migration remains non-destructive", () => {
    expect(migration).not.toMatch(/drop table/i);
    expect(migration).not.toMatch(/\btruncate\b/i);
    expect(migration).not.toMatch(/\bdelete from\b/i);
  });
});
