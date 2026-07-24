import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  VIEW_ANTI_SPAM,
  VIEW_DWELL_MS,
  VIEW_LEVEL_8_OWNER_QA,
  VIEW_OWNER_PROTECTION,
  VIEW_RULES,
  VIEW_SSOT,
} from "@/lib/views/view-system-v1-lock";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — View Engine Master Spec (listing seller = 0)", () => {
  it("lock constants enforce listing seller = 0 · Owner may count", () => {
    expect(VIEW_OWNER_PROTECTION.ownerOpens).toBe("+0 VIEWS");
    expect(VIEW_RULES.ownerOpen).toContain("+0");
    expect(VIEW_ANTI_SPAM.ownerExcluded).toBe(true);
    expect(VIEW_ANTI_SPAM.adminExcluded).toBe(false);
    expect(VIEW_ANTI_SPAM.superAdminExcluded).toBe(false);
    expect(VIEW_ANTI_SPAM.botsSkipped).toBe(true);
    expect(VIEW_ANTI_SPAM.unpublishedExcluded).toBe(true);
    expect(VIEW_DWELL_MS).toBe(1000);
    expect(VIEW_SSOT.engine).toBe("lib/views/record-product-view.ts");
    expect(VIEW_LEVEL_8_OWNER_QA.join(" ")).toContain("Owner click");
  });

  it("record-product-view enforces listing seller = 0 before commit", () => {
    const engine = readSource("lib/views/record-product-view.ts");
    expect(engine).toContain('reason: "owner"');
    expect(engine).toContain("product.seller_id === user.id");
    expect(engine).toContain('reason: "unpublished"');
    expect(engine).toContain('reason: "bot"');
    expect(engine).toContain("commitUniqueProductView");
    expect(engine).toContain("createServiceRoleClient");
    expect(engine).not.toContain("isAdmin");
    expect(engine).not.toContain("isPlatformStaff");
    expect(engine.indexOf("SELLER = 0")).toBeLessThan(
      engine.indexOf("await commitUniqueProductView"),
    );
    expect(engine.indexOf("product.seller_id === user.id")).toBeLessThan(
      engine.indexOf("await commitUniqueProductView"),
    );
  });

  it("API route uses recordProductView only", () => {
    const api = readSource("app/api/views/route.ts");
    expect(api).toContain("recordProductView");
    expect(api).toContain("counted");
  });

  it("viewer-key rejects bots; live sync has no owner bypass", () => {
    const key = readSource("lib/views/viewer-key.ts");
    const live = readSource("lib/views/view-live-sync.ts");
    const hook = readSource("lib/views/use-live-product-views.ts");
    expect(key).toContain("isBotUserAgent");
    expect(live).not.toContain("owner bypass");
    expect(hook).toContain("getLiveViewCount");
  });

  it("SQL #1–#4 remain unmodified production-approved set", () => {
    const sql1 = readSource("supabase/migrations/20260721200000_product_view_system_v1.sql");
    const sql2 = readSource("supabase/migrations/20260721210000_product_view_production_lock_v1.sql");
    const sql3 = readSource("supabase/migrations/20260721220000_view_master_architect_l7_v1.sql");
    expect(sql1).toContain("product_view_events");
    expect(sql1).toContain("p_viewer_user_id = v_seller_id");
    expect(sql2).toContain("super_admin");
    expect(sql3).toContain("record_unique_product_view");
  });

  it("SQL #4 keeps OWNER = 0 historical; SQL #5 Master Spec evolves in place", () => {
    const sql4 = readSource(
      "supabase/migrations/20260721230000_view_owner_zero_canonical_v1.sql",
    );
    const sql5 = readSource(
      "supabase/migrations/20260724030000_view_engine_master_spec_v1.sql",
    );
    expect(sql4).toContain("OWNER = 0");
    expect(sql4).toContain("p_viewer_user_id = v_seller_id");
    expect(sql5).toContain("SELLER = 0");
    expect(sql5).toContain("p_viewer_user_id = v_seller_id");
    expect(sql5).not.toContain("v_role in");
  });

  it("beacon dwell is 1000ms (Master Spec ≤2s)", () => {
    const beacon = readSource("features/product-detail/RecordProductViewBeacon.tsx");
    expect(beacon).toContain("1000");
    expect(beacon).not.toMatch(/DWELL_MS = 1500/);
  });
});
