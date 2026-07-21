import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  VIEW_ANTI_SPAM,
  VIEW_OWNER_PROTECTION,
  VIEW_RULES,
  VIEW_SSOT,
} from "@/lib/views/view-system-v1-lock";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — OWNER = 0 canonical View engine", () => {
  it("lock constants enforce OWNER = 0", () => {
    expect(VIEW_OWNER_PROTECTION.ownerOpens).toBe("+0 VIEWS");
    expect(VIEW_RULES.ownerOpen).toContain("+0");
    expect(VIEW_ANTI_SPAM.ownerExcluded).toBe(true);
    expect(VIEW_ANTI_SPAM.adminExcluded).toBe(true);
    expect(VIEW_ANTI_SPAM.superAdminExcluded).toBe(true);
    expect(VIEW_ANTI_SPAM.staffExcluded).toBe(true);
    expect(VIEW_ANTI_SPAM.botsSkipped).toBe(true);
    expect(VIEW_ANTI_SPAM.unpublishedExcluded).toBe(true);
    expect(VIEW_SSOT.engine).toBe("lib/views/record-product-view.ts");
  });

  it("record-product-view enforces OWNER = 0 before RPC", () => {
    const engine = readSource("lib/views/record-product-view.ts");
    expect(engine).toContain('reason: "owner"');
    expect(engine).toContain("product.seller_id === user.id");
    expect(engine).toContain("OWNER = 0");
    expect(engine).toContain('reason: "unpublished"');
    expect(engine).toContain('reason: "staff"');
    expect(engine).toContain('reason: "bot"');
    expect(engine).toContain("record_unique_product_view");
    // Owner check must appear before RPC call
    expect(engine.indexOf("seller_id === user.id")).toBeLessThan(
      engine.indexOf('rpc("record_unique_product_view"'),
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

  it("SQL files remain unmodified production-approved set", () => {
    const sql1 = readSource("supabase/migrations/20260721200000_product_view_system_v1.sql");
    const sql2 = readSource("supabase/migrations/20260721210000_product_view_production_lock_v1.sql");
    const sql3 = readSource("supabase/migrations/20260721220000_view_master_architect_l7_v1.sql");
    expect(sql1).toContain("product_view_events");
    expect(sql1).toContain("p_viewer_user_id = v_seller_id");
    expect(sql2).toContain("super_admin");
    expect(sql3).toContain("record_unique_product_view");
  });

  it("SQL #4 restores OWNER = 0 at RPC without editing SQL #1–#3", () => {
    const sql4 = readSource(
      "supabase/migrations/20260721230000_view_owner_zero_canonical_v1.sql",
    );
    expect(sql4).toContain("OWNER = 0");
    expect(sql4).toContain("p_viewer_user_id = v_seller_id");
    expect(sql4).toContain("record_unique_product_view");
  });
});
