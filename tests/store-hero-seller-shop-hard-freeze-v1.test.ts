import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STORE_HERO_FEATURED_SLOT_COUNT,
  STORE_HERO_SHARE_CARD,
  STORE_HERO_SHARE_CARD_SIZE,
  STORE_HERO_SHARE_CARD_STRUCTURE_IDS,
} from "@/lib/store-sharing/store-hero-share-card-v1";
import {
  STORE_HERO_NATIVE_SHOP_SHARE_PATH_PREFIX,
  STORE_HERO_SHARE_CARD_CANONICAL,
  STORE_HERO_SHARE_CARD_END_PHRASE,
  STORE_HERO_SHARE_CARD_FORBIDDEN_DUPLICATES,
  STORE_HERO_SHARE_CARD_FREEZE,
  STORE_HERO_SHARE_CARD_FREEZE_STATUS,
  STORE_HERO_SHARE_CARD_SCOPE,
  STORE_HERO_WEB_OG_URL_PREFIX,
} from "@/lib/store-sharing/store-hero-share-card-freeze-v1";
import {
  IN_APP_STORE_SHARE_CARD,
  SELLER_SHOP_CANONICAL,
  SELLER_SHOP_END_PHRASE,
  SELLER_SHOP_FREEZE_STATUS,
  STORE_HERO_SELLER_SHOP_HARD_FREEZE,
  STORE_HERO_SELLER_SHOP_HARD_FREEZE_SNAPSHOT,
  STORE_HERO_SELLER_SHOP_HARD_FREEZE_STATUS,
  STORE_HERO_SELLER_SHOP_UNLOCK,
  WEB_VISIT_STORE_CANONICAL,
} from "@/lib/store-sharing/store-hero-seller-shop-hard-freeze-v1";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "test-results") {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx|kt)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function walkSourceFiles(): string[] {
  const acc: string[] = [];
  for (const dir of ["app", "lib", "features", "components", "tests", "e2e"]) {
    walkFiles(join(ROOT, dir), acc);
  }
  return acc;
}

describe("Store Hero + Seller Shop hard freeze", () => {
  it("locks Store Hero as SHARE / OG ONLY with one renderer", () => {
    expect(STORE_HERO_SHARE_CARD_FREEZE).toBe("ACTIVE");
    expect(STORE_HERO_SHARE_CARD_FREEZE_STATUS).toBe(
      "ROVEXO STORE HERO CARD v1.0 — SHARE / OG ONLY — FROZEN",
    );
    expect(STORE_HERO_SHARE_CARD_END_PHRASE).toBe("END STORE HERO FREEZE");
    expect(STORE_HERO_SHARE_CARD_CANONICAL.renderer).toBe(
      "lib/store-sharing/store-hero-share-card-v1.ts",
    );
    expect(STORE_HERO_SHARE_CARD).toBe("store-hero-share-card-v1");
    expect(STORE_HERO_SHARE_CARD_SIZE).toEqual({ width: 1200, height: 630 });
    expect(STORE_HERO_SHARE_CARD_STRUCTURE_IDS).toHaveLength(11);
    expect(STORE_HERO_FEATURED_SLOT_COUNT).toBe(5);

    const renderer = read("lib/store-sharing/store-hero-share-card-v1.ts");
    expect(renderer.match(/export function renderStoreHeroShareCardSvg/g)).toHaveLength(1);
    expect(renderer).not.toMatch(/VIEW STORE|StoreVisitPageV2|SellerShopScreen/);

    const og = read("app/api/seo/og/route.ts");
    expect(og).toContain("renderStoreHeroShareCardSvg");
    expect(og).toContain('kind === "store"');
    expect(og).not.toContain("/api/seo/store-og");
  });

  it("preserves URL contracts without unification", () => {
    expect(STORE_HERO_WEB_OG_URL_PREFIX).toBe("https://www.rovexo.co.uk/@");
    expect(STORE_HERO_NATIVE_SHOP_SHARE_PATH_PREFIX).toBe("/store/");
    expect(read("lib/store-sharing/store-share-v1.ts")).toContain(
      "https://www.rovexo.co.uk/@username",
    );
    expect(read("lib/seo/engine/metadata.ts")).toContain("buildStoreShareMetadata");
    expect(read("lib/seo/engine/metadata.ts")).toContain("toStoreShareData");
  });

  it("keeps one in-app StoreShareCard and one Web Visit Store", () => {
    expect(IN_APP_STORE_SHARE_CARD.file).toBe("features/store-sharing/StoreShareCard.tsx");
    expect(WEB_VISIT_STORE_CANONICAL.page).toBe("features/store/components/StoreVisitPageV2.tsx");
    expect(WEB_VISIT_STORE_CANONICAL.route).toBe("/store/[slug]");

    const shareCard = read("features/store-sharing/StoreShareCard.tsx");
    expect(shareCard).toContain("export function StoreShareCard");
    expect(shareCard).not.toContain("store-hero-share-card-v1");
    expect(shareCard).not.toContain("renderStoreHeroShareCardSvg");

    const visit = read("features/store/components/StoreVisitPageV2.tsx");
    expect(visit).toContain("export function StoreVisitPageV2");
    expect(visit).not.toContain("store-hero-share-card-v1");
    expect(visit).not.toContain("renderStoreHeroShareCardSvg");

    const storeRoute = read("app/(platform)/store/[slug]/page.tsx");
    expect(storeRoute).toContain("StoreVisitPageV2");
  });

  it("forbids platform-specific Store Hero duplicates", () => {
    const files = walkSourceFiles();
    for (const name of STORE_HERO_SHARE_CARD_FORBIDDEN_DUPLICATES) {
      const hits = files.filter((file) => file.includes(name));
      expect(hits, name).toEqual([]);
    }
  });

  it("locks Seller Shop as a separate native surface", () => {
    expect(STORE_HERO_SELLER_SHOP_HARD_FREEZE).toBe("ACTIVE");
    expect(STORE_HERO_SELLER_SHOP_HARD_FREEZE_STATUS).toBe(
      "ROVEXO STORE HERO + SELLER SHOP — HARD FREEZE ACTIVE",
    );
    expect(SELLER_SHOP_FREEZE_STATUS).toBe("ROVEXO SELLER SHOP — FROZEN");
    expect(SELLER_SHOP_END_PHRASE).toBe("END SELLER SHOP FREEZE");
    expect(SELLER_SHOP_CANONICAL.screen).toBe("SellerShopScreen");
    expect(SELLER_SHOP_CANONICAL.ssot).not.toBe(STORE_HERO_SHARE_CARD_CANONICAL.renderer);
    expect(SELLER_SHOP_CANONICAL.ssot).toContain("apps/");
    expect(SELLER_SHOP_CANONICAL.screenFile).toContain(SELLER_SHOP_CANONICAL.screen);
    expect(SELLER_SHOP_CANONICAL.screenFile.includes("SellerShopScreenV2")).toBe(false);

    expect(STORE_HERO_SHARE_CARD_SCOPE).toBe("SHARE_OG_ONLY");
    expect(STORE_HERO_SELLER_SHOP_UNLOCK.storeHero).toBe("END STORE HERO FREEZE");
    expect(STORE_HERO_SELLER_SHOP_UNLOCK.sellerShop).toBe("END SELLER SHOP FREEZE");
    expect(STORE_HERO_SELLER_SHOP_UNLOCK.storeHero).not.toBe(
      STORE_HERO_SELLER_SHOP_UNLOCK.sellerShop,
    );
    expect(STORE_HERO_SELLER_SHOP_HARD_FREEZE_SNAPSHOT.storeHero.scope).toBe("SHARE_OG_ONLY");
    expect(STORE_HERO_SELLER_SHOP_HARD_FREEZE_SNAPSHOT.storeHero.renderer).toBe(
      "lib/store-sharing/store-hero-share-card-v1.ts",
    );
    expect(STORE_HERO_SELLER_SHOP_HARD_FREEZE_SNAPSHOT.sellerShop.screen).toBe("SellerShopScreen");
    expect(STORE_HERO_SELLER_SHOP_HARD_FREEZE_SNAPSHOT.urls.nativeShopSharePath).toBe("/store/");

    const hardFreeze = read("lib/store-sharing/store-hero-seller-shop-hard-freeze-v1.ts");
    expect(hardFreeze).toContain("SHARE / OG ONLY");
    expect(hardFreeze).toContain("NATIVE SHOP EXPERIENCE");
    expect(hardFreeze).toContain("Neither may replace the other");
    expect(hardFreeze).not.toContain("from \"@/app/api/store");
    expect(hardFreeze).not.toContain("resolve-seller-account-type");

    const renderer = read("lib/store-sharing/store-hero-share-card-v1.ts");
    expect(renderer).not.toContain("from \"@/app/api/store");
    expect(renderer).not.toContain("resolve-seller-account-type");
    expect(renderer).not.toMatch(/import .*SellerShopScreen/);

    const heroRule = read(".cursor/rules/store-hero-seller-shop-hard-freeze-v1.mdc");
    expect(heroRule).toContain("END SELLER SHOP FREEZE");
    expect(heroRule).toContain("SellerShopScreen");
    expect(heroRule).toContain("Do not import Store Hero into Shop");
    expect(heroRule).toContain("External Share / OG only");
  });

  it("preserves dedicated Store Hero and Store Share regression files", () => {
    for (const file of [
      "tests/store-hero-share-card-v1.test.ts",
      "tests/store-share-v1.test.ts",
      "tests/store-share-dynamic-card-v1.test.ts",
      "e2e/store-share-v1.spec.ts",
      "tests/store-v2-final-v1.test.ts",
    ]) {
      expect(existsSync(join(ROOT, file)), file).toBe(true);
    }
    const heroTests = read("tests/store-hero-share-card-v1.test.ts");
    expect(heroTests).toContain("returns a 1200×630 PNG");
    expect(heroTests).toContain("uses one equal structure for every seller type");
    expect(heroTests).toContain("rejects invalid usernames");
    expect(heroTests).not.toContain("it.skip");
    expect(heroTests).not.toContain("describe.skip");
  });
});
