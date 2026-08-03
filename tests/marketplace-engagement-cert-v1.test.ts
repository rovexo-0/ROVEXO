import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ARCHITECTURE_GATES,
  ENGAGEMENT_SYSTEMS,
  MARKETPLACE_ENGAGEMENT_CERT_STATUS,
  MASTER_ARCHITECT_SURFACES,
  PRODUCTION_READY_REQUIRES,
} from "@/lib/engagement/marketplace-engagement-cert-v1";
import { VIEW_ANTI_SPAM, VIEW_RULES, VIEW_SSOT } from "@/lib/views/view-system-v1-lock";
import { isBotUserAgent } from "@/lib/views/viewer-key";
import { SAVED_FINAL_FREEZE_STATUS, SAVED_SSOT } from "@/lib/saved/saved-final-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Master Architect engagement certification", () => {
  it("awaits CEO L8 — never self-certifies production", () => {
    expect(MARKETPLACE_ENGAGEMENT_CERT_STATUS).toBe("AWAITING_CEO_L8");
    expect(PRODUCTION_READY_REQUIRES).toContain("LEVEL_8_CEO_PRODUCTION_APPROVAL");
    expect(ENGAGEMENT_SYSTEMS.socialFeatures).toBe("FORBIDDEN");
    expect(ENGAGEMENT_SYSTEMS.saved).toBe("VINTED_STYLE");
    expect(ENGAGEMENT_SYSTEMS.views).toBe("VINTED_PLUS_EBAY");
  });

  it("lists all Master Architect surfaces", () => {
    expect(MASTER_ARCHITECT_SURFACES).toContain("Homepage");
    expect(MASTER_ARCHITECT_SURFACES).toContain("Saved");
    expect(MASTER_ARCHITECT_SURFACES).toContain("Product page");
    expect(MASTER_ARCHITECT_SURFACES).toContain("Anti spam");
    expect(MASTER_ARCHITECT_SURFACES).toContain("Live Sync");
    expect(ARCHITECTURE_GATES.zeroDesync).toBe(true);
    expect(ARCHITECTURE_GATES.ownerProtection).toBe(true);
  });

  it("View System — Absolute Authority · OWNER = 0 · refresh +0 · not Production Ready", () => {
    expect(VIEW_SSOT.table).toBe("product_view_events");
    expect(VIEW_SSOT.rpc).toBe("record_unique_product_view");
    expect(VIEW_RULES.ownerOpen).toContain("+0");
    expect(VIEW_RULES.f5).toContain("+0");
    expect(VIEW_RULES.refresh1000).toContain("+0");
    expect(VIEW_RULES.localStorage).toBe(false);
    expect(VIEW_ANTI_SPAM.maxUniqueProductViewsPerHour).toBe(60);
    expect(VIEW_ANTI_SPAM.ownerExcluded).toBe(true);
    expect(VIEW_ANTI_SPAM.botsSkipped).toBe(true);
    expect(VIEW_ANTI_SPAM.adminExcluded).toBe(false);

    const engine = readSource("lib/views/record-product-view.ts");
    expect(engine).toContain('reason: "owner"');
    expect(engine).toContain("seller_id === user.id");

    const listing = readSource("app/(platform)/listing/[slug]/page.tsx");
    expect(listing).not.toContain("recordProductView");
    expect(listing).not.toContain("from \"next/server\"");

    const detail = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(detail).toContain("RecordProductViewBeacon");

    expect(isBotUserAgent("Mozilla/5.0 Compatible Googlebot/2.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(false);
  });

  it("Saved System — PRODUCTION LOCK FREEZE YES · DB truth · no invented SSOT bus", () => {
    expect(SAVED_FINAL_FREEZE_STATUS).toBe("PRODUCTION_LOCK");
    expect(SAVED_SSOT.heartHook).toBe("features/home/hooks/use-product-watchlist.ts");
    expect(existsSync(join(process.cwd(), "lib/favourites/favourite-store.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/saved/saved-ssot.ts"))).toBe(false);

    const api = readSource("app/api/saved/route.ts");
    expect(api).toContain("saveItem");
    expect(api).toContain("removeSavedItems");
    expect(api).not.toContain("publishSavedLive");

    const hook = readSource("features/home/hooks/use-product-watchlist.ts");
    expect(hook).toContain("setIsSaved(nextSaved)");
    expect(hook).not.toContain("router.refresh");
    expect(hook).not.toContain("localStorage");
  });

  it("social follow system remains removed", () => {
    expect(existsSync(join(process.cwd(), "features/social/FollowSellerButton.tsx"))).toBe(
      false,
    );
    const removal = readSource(
      "supabase/migrations/20260721193000_social_follow_system_removal_v1.sql",
    );
    expect(removal.length).toBeGreaterThan(20);
  });
});
