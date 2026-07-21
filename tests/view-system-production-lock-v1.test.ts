import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  VIEW_ANTI_SPAM,
  VIEW_DO_NOT_COUNT,
  VIEW_DWELL_MS,
  VIEW_ENGINE_LOCK,
  VIEW_LEVEL_8_OWNER_QA,
  VIEW_MULTI_USER,
  VIEW_OWNER_PROTECTION,
  VIEW_PROTECTED_ENGINES,
  VIEW_RULES,
  VIEW_SSOT,
  VIEW_SYNC_ENGINE,
  VIEW_SYSTEM_FREEZE,
  VIEW_SYSTEM_LEVEL,
  VIEW_SYSTEM_PRODUCTION_READY,
  VIEW_SYSTEM_STATUS,
} from "@/lib/views/view-system-v1-lock";
import { formatProductViewsLabel } from "@/lib/listing-card/format";
import { isBotUserAgent } from "@/lib/views/viewer-key";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Absolute Authority View Engine Lock", () => {
  it("locks permanently · Level 8 protected · not Production Ready", () => {
    expect(VIEW_ENGINE_LOCK).toBe("ABSOLUTE_AUTHORITY_v1.0");
    expect(VIEW_SYSTEM_LEVEL).toBe(8);
    expect(VIEW_SYSTEM_STATUS).toBe("PERMANENTLY_LOCKED_NOT_PRODUCTION_READY");
    expect(VIEW_SYSTEM_FREEZE).toBe(true);
    expect(VIEW_SYSTEM_PRODUCTION_READY).toBe(false);
    expect(VIEW_DWELL_MS).toBe(1500);
    expect(VIEW_RULES.ownerOpen).toContain("+0");
    expect(VIEW_OWNER_PROTECTION.ownerOpens).toBe("+0 VIEWS");
    expect(VIEW_OWNER_PROTECTION.bypassForbidden).toBe(true);
    expect(VIEW_ANTI_SPAM.ownerExcluded).toBe(true);
    expect(VIEW_SSOT.authority).toContain("DATABASE ONLY");
  });

  it("forbids counting from locked surfaces", () => {
    for (const surface of [
      "Homepage",
      "Search",
      "Saved",
      "Stores",
      "Hover",
      "Scroll",
      "Refresh",
      "Bots",
      "Owner spam",
    ]) {
      expect(VIEW_DO_NOT_COUNT).toContain(surface);
    }
  });

  it("sync engine is canonical POST → RPC → DB → publishViewLive", () => {
    expect(VIEW_SYNC_ENGINE[0]).toBe("POST /api/views");
    expect(VIEW_SYNC_ENGINE.join(" → ")).toContain("record_unique_product_view()");
    expect(VIEW_SYNC_ENGINE.join(" → ")).toContain("publishViewLive()");
    expect(VIEW_MULTI_USER.rule).toContain("UNIQUE USERS");
    expect(VIEW_LEVEL_8_OWNER_QA).toContain("0 → OWNER OPEN → 0");
    expect(VIEW_PROTECTED_ENGINES).toContain("Owner Protection");
  });

  it("UI labels remain Owner format", () => {
    expect(formatProductViewsLabel(1)).toBe("1 View");
    expect(formatProductViewsLabel(2)).toBe("2 Views");
    expect(formatProductViewsLabel(1100)).toBe("1.1K Views");
  });

  it("listing page never auto-increments views", () => {
    const page = readSource("app/listing/[slug]/page.tsx");
    expect(page).not.toContain("recordProductView");
    expect(page).not.toContain("incrementProductViews");
  });

  it("product page uses dwell beacon → API only", () => {
    const beacon = readSource("features/product-detail/RecordProductViewBeacon.tsx");
    const detail = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(beacon).toContain("1500");
    expect(beacon).toContain('fetch("/api/views"');
    expect(detail).toContain("RecordProductViewBeacon");
  });

  it("ListingCard displays live views · never POSTs /api/views", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    expect(card).toContain("useLiveProductViews");
    expect(card).not.toContain("/api/views");
  });

  it("bots are rejected", () => {
    expect(isBotUserAgent("Googlebot/2.1")).toBe(true);
  });
});
