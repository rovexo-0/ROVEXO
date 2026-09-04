import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SAVED_ALLOWED,
  SAVED_EMPTY_STATE,
  SAVED_FINAL_FREEZE,
  SAVED_FINAL_FREEZE_STATUS,
  SAVED_FORBIDDEN,
  SAVED_LIVE_RULE,
  SAVED_SSOT,
} from "@/lib/saved/saved-final-freeze-v1";
import {
  LIVE_EMPTY_STATE,
  LIVE_HEART_RULES,
  SAVED_LIVE_CANONICAL,
  SAVED_LIVE_FREEZE,
  SAVED_LIVE_STATUS,
  SAVED_PRODUCTION_ALLOWED,
  SAVED_PRODUCTION_FORBIDDEN,
} from "@/lib/saved/saved-live-production-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Saved PRODUCTION LOCK (FREEZE YES)", () => {
  it("locks PRODUCTION LOCK · FREEZE YES · www authority", () => {
    expect(SAVED_FINAL_FREEZE_STATUS).toBe("PRODUCTION_LOCK");
    expect(SAVED_FINAL_FREEZE).toBe(true);
    expect(SAVED_LIVE_STATUS).toBe("PRODUCTION_LOCK");
    expect(SAVED_LIVE_FREEZE).toBe(true);
    expect(SAVED_LIVE_CANONICAL).toBe("https://www.rovexo.co.uk");
    expect(LIVE_HEART_RULES.optimistic).toBe(true);
    expect(LIVE_HEART_RULES.uiUpdateMs).toBe(0);
    expect(LIVE_HEART_RULES.sharedSsotBus).toBe(false);
    expect(LIVE_HEART_RULES.authority).toBe("database");
    expect(SAVED_LIVE_RULE.authority).toBe("database");
    expect(SAVED_SSOT.heartHook).toBe("features/home/hooks/use-product-watchlist.ts");
  });

  it("Owner ALLOWED / NOT ALLOWED lists are locked", () => {
    for (const item of SAVED_PRODUCTION_ALLOWED) {
      expect(SAVED_ALLOWED).toContain(item);
    }
    for (const item of SAVED_PRODUCTION_FORBIDDEN) {
      expect(SAVED_FORBIDDEN).toContain(item);
    }
    expect(SAVED_FORBIDDEN).toContain("Collections");
    expect(SAVED_FORBIDDEN).toContain("Followers");
    expect(SAVED_FORBIDDEN).toContain("Following");
    expect(SAVED_FORBIDDEN).toContain("Lists");
    expect(SAVED_FORBIDDEN).toContain("Undo button");
    expect(SAVED_FORBIDDEN).toContain("Social features");
    expect(SAVED_FORBIDDEN).toContain("Multiple Saved systems");
    expect(SAVED_FORBIDDEN).toContain("LocalStorage authority");
  });

  it("FavouriteStore remains deleted", () => {
    expect(existsSync(join(process.cwd(), "lib/favourites/favourite-store.ts"))).toBe(false);
  });

  it("invented SSOT bus files are removed", () => {
    expect(existsSync(join(process.cwd(), "lib/saved/saved-ssot.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/saved/use-saved-ssot.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/saved/saved-live-sync.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib/saved/saved-heart-api.ts"))).toBe(false);
    expect(existsSync(join(process.cwd(), "components/saved/SavedHeartButton.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "components/saved/SavedSsotBridge.tsx"))).toBe(false);
    expect(
      existsSync(join(process.cwd(), "features/product-detail/ProductSavedHeartButton.tsx")),
    ).toBe(false);
  });

  it("LIVE heart hook is optimistic useProductWatchlist", () => {
    const hook = readSource("features/home/hooks/use-product-watchlist.ts");
    expect(hook).toContain("setIsSaved(nextSaved)");
    expect(hook).toContain('method: nextSaved ? "POST" : "DELETE"');
    // Batch hydrate (one GET /api/saved list) — same Saved SSOT, zero N+1 slug waterfalls
    expect(hook).toContain('fetch("/api/saved"');
    expect(hook).toContain("loadSavedSlugSet");
    expect(hook).toContain("if (isPending) return");
    expect(hook).not.toContain("useRouter");
    expect(hook).not.toContain("router.refresh");
    expect(hook).not.toContain("publishSavedLive");
    expect(hook).not.toContain("localStorage");
  });

  it("Homepage / Search / Store use useProductWatchlist — one Saved system", () => {
    const card = readSource("components/ui/ListingCard.tsx");
    const search = readSource("features/search/components/SearchResultCard.tsx");
    const store = readSource("components/home/stores/StoreCard.tsx");
    const layout = readSource("app/layout.tsx");

    expect(card).toContain("useProductWatchlist");
    expect(card).not.toContain("SavedHeartButton");
    expect(search).toContain("useProductWatchlist");
    expect(search).not.toContain("SavedHeartButton");
    expect(store).toContain("useProductWatchlist");
    expect(store).not.toContain("SavedHeartButton");
    expect(layout).not.toContain("SavedSsotBridge");
  });

  it("Saved page DELETE → setItems immediately + LIVE empty state", () => {
    const page = readSource("features/account-module/components/SavedItemsV1.tsx");
    expect(page).toContain("setItems(payload.items)");
    expect(page).toContain('favoriteMode="controlled"');
    expect(page).toContain(LIVE_EMPTY_STATE.title);
    expect(page).toContain(LIVE_EMPTY_STATE.cta);
    expect(page).toContain(`href="${LIVE_EMPTY_STATE.ctaHref}"`);
    expect(SAVED_EMPTY_STATE.title).toBe(LIVE_EMPTY_STATE.title);
    expect(page).not.toContain("Undo");
    expect(page).not.toContain("Collection");
    expect(page).not.toContain("Followers");
  });

  it("API matches LIVE POST/DELETE contracts — database truth", () => {
    const api = readSource("app/api/saved/route.ts");
    expect(api).toContain("saveItem");
    expect(api).toContain("removeSavedItems");
    expect(api).toContain("{ saved: true }");
    expect(api).not.toContain("publishSavedLive");
    expect(api).not.toContain("verified");
  });
});
