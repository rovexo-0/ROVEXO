import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { INVENTORY_ENGINE_V1 } from "@/lib/inventory/inventory-engine-v1";
import { isPurchasable, isReservedListing } from "@/lib/inventory/service";

describe("Inventory Engine v1.0 — RESERVED Absolute Law", () => {
  it("locks official chain and forbidden reserve mutations", () => {
    expect(INVENTORY_ENGINE_V1.bloodCode).toBe("RVX-2012");
    expect(INVENTORY_ENGINE_V1.officialChain).toContain("RESERVED");
    expect(INVENTORY_ENGINE_V1.officialChain).toContain("SOLD");
    expect(INVENTORY_ENGINE_V1.reservationMinutes).toBe(2);
    expect(INVENTORY_ENGINE_V1.reservationSeconds).toBe(120);
    expect(INVENTORY_ENGINE_V1.reservationSsot).toContain("checkout_sessions");
    expect(INVENTORY_ENGINE_V1.reservationFields).toContain("reservationId");
    expect(INVENTORY_ENGINE_V1.releaseTriggers).toContain("PAYMENT_TIMEOUT_120S");
    expect(INVENTORY_ENGINE_V1.onlyBlockerUntilApplied).toBe("SQL_MIGRATION");
    expect(INVENTORY_ENGINE_V1.reserveSets.status).toBe("reserved");
    expect(INVENTORY_ENGINE_V1.reserveSets.stockUnchanged).toBe(true);
    expect(INVENTORY_ENGINE_V1.forbiddenOnReserve).toContain("status=sold");
    expect(INVENTORY_ENGINE_V1.forbiddenOnReserve).toContain("stock=0");
    expect(INVENTORY_ENGINE_V1.markSoldSets).toEqual({
      status: "published",
      reserved: false,
      stockDecrementByQuantity: true,
      outOfStockRemainsVisible: true,
    });
    expect(INVENTORY_ENGINE_V1.productStatusEnum).toEqual([
      "draft",
      "published",
      "reserved",
      "paused",
      "sold",
      "deleted",
    ]);
  });

  it("purchasable only when published + stock > 0", () => {
    expect(isPurchasable(1, "published")).toBe(true);
    expect(isPurchasable(1, "reserved")).toBe(false);
    expect(isPurchasable(0, "published")).toBe(false);
    expect(isPurchasable(1, "sold")).toBe(false);
    expect(isReservedListing("reserved", true)).toBe(true);
    expect(isReservedListing("published", false)).toBe(false);
  });

  it("reserve RPC SQL never sets sold or stock=0", () => {
    const sql = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260724223100_inventory_engine_reserved_rpc_v1.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("status = 'reserved'::public.product_status");
    expect(sql).toContain("reserved = true");
    expect(sql).toContain("create or replace function public.mark_product_sold");
    expect(sql).toContain("stock = stock - p_quantity");
    expect(sql).not.toMatch(
      /create or replace function public\.mark_product_sold\([\s\S]*?stock = 0/,
    );

    const multiStockSql = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260726173000_inventory_multi_stock_visible_oos_v1.sql",
      ),
      "utf8",
    );
    expect(multiStockSql).toContain("v_remaining := v_stock - p_quantity");
    expect(multiStockSql).toContain("status = 'published'::public.product_status");
    expect(multiStockSql).toContain("stock = v_remaining");
    // reserve_product_inventory body must not assign sold
    const reserveFn = sql.slice(
      sql.indexOf("create or replace function public.reserve_product_inventory"),
      sql.indexOf("create or replace function public.release_product_inventory"),
    );
    expect(reserveFn).not.toMatch(/'sold'::public\.product_status/);
    expect(reserveFn).not.toMatch(/stock\s*=\s*stock\s*-/);
    expect(reserveFn).not.toMatch(/stock\s*=\s*0/);
  });

  it("Buy Now post-lock requires reserved — never sold-before-checkout", () => {
    const engine = readFileSync(
      path.join(process.cwd(), "lib/checkout/engines/buy-now-engine-v1.ts"),
      "utf8",
    );
    expect(engine).toContain('lockedProduct.status !== "reserved"');
    expect(engine).not.toContain(
      "After reserve, stock may be 0 — status must still be published",
    );
  });

  it("Absolute Law — every post-lock fail unlocks (no reserved stranding)", () => {
    const engine = readFileSync(
      path.join(process.cwd(), "lib/checkout/engines/buy-now-engine-v1.ts"),
      "utf8",
    );
    expect(engine).toContain("failAfterLock");
    expect(engine).toContain("LISTING_UNLOCK_ENGINE");
    expect(engine).toContain('return await failAfterLock("RVX-2008")');
    expect(engine).toContain("CHECKOUT_SESSION_ENGINE_destroy");
    // After session create, destroy releases inventory (not bare fail without unlock).
    expect(engine).toContain('return fail("RVX-2010")');
    expect(engine).toContain("return fail(resolveCheckoutGuard16FailureCode(guard16))");
    expect(engine).toContain('return await failAfterLock("RVX-2012")');
    const destroyBlocks = engine.split("CHECKOUT_SESSION_ENGINE_destroy");
    expect(destroyBlocks.length).toBeGreaterThan(2);
  });
});
