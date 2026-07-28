/**
 * ROVEXO ABSOLUTE BLOOD LAW XXXV
 * CATEGORY VISUAL IDENTITY SYSTEM
 *
 * STATUS: LOCKED | PRODUCTION READY
 *
 * Every Root Category has a unique premium visual identity.
 * The category image is navigation — users must recognise the category
 * before reading its name.
 *
 * One Platform · One Design Language · One Visual System · One Category Style
 *
 * Parent: Global Production Freeze XXXIV · Catalog Master XXX–XXXIII
 * Assets: public/categories/{key}.{png,webp,avif} · public/search/categories/{key}.png
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { workspacePath } from "@/lib/server/workspace-path";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import {
  ROVEXO_CANONICAL_RAIL_ICON_KEYS,
  ROVEXO_CATEGORY_RENDER_SIZE,
  type RovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { SEARCH_CATEGORY_HEROES_V1 } from "@/lib/search/search-category-heroes-v1";

export const SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1 = {
  version: "1.0",
  bloodLaw: "XXXV",
  name: "Category Visual Identity System",
  status: "LOCKED_PRODUCTION_READY",
  locked: true,
  productionReady: true,
  lockedAt: "2026-07-25",
  equation:
    "ONE_PLATFORM = ONE_DESIGN_LANGUAGE = ONE_VISUAL_SYSTEM = ONE_CATEGORY_STYLE = ONE_PREMIUM_EXPERIENCE",
  mission:
    "Every Root Category shall have a unique premium visual identity used for platform navigation.",
  renderSizePx: ROVEXO_CATEGORY_RENDER_SIZE,
  assetRoots: {
    premium: "public/categories",
    searchHeroes: "public/search/categories",
  } as const,

  visualPrinciples: [
    "Clean",
    "Premium",
    "Modern",
    "Realistic",
    "High Resolution",
    "White Background",
    "Consistent Lighting",
    "Premium Shadow",
    "Same Perspective",
    "Same Visual Style",
    "Same Image Size",
    "Same Margin",
    "Same Composition",
  ] as const,

  forbidden: [
    "Random images",
    "Mixed illustration styles",
    "Cartoon graphics",
    "Low resolution",
    "Dark backgrounds",
    "Busy compositions",
    "Inconsistent lighting",
    "Different perspectives",
  ] as const,

  imageStyle: [
    "Studio photography",
    "White background",
    "Soft shadow",
    "45° perspective",
    "Centered composition",
    "Premium lighting",
    "Minimal distractions",
  ] as const,

  /** Subject matter lock per production root (asset content brief). */
  rootVisuals: [
    {
      name: "Women's Fashion",
      slug: "womens-fashion",
      assetKey: "womens-fashion" as RovexoCategoryPremiumKey,
      subjects: ["Luxury handbag", "High heels", "Sunglasses"],
    },
    {
      name: "Men's Fashion",
      slug: "mens-fashion",
      assetKey: "mens-fashion" as RovexoCategoryPremiumKey,
      subjects: ["Sneakers", "Leather jacket", "Watch"],
    },
    {
      name: "Designer",
      slug: "jewellery",
      assetKey: "jewellery" as RovexoCategoryPremiumKey,
      subjects: ["Luxury watch", "Diamond ring", "Luxury jewellery"],
    },
    {
      name: "Kids & Baby",
      slug: "kids-fashion",
      assetKey: "kids-fashion" as RovexoCategoryPremiumKey,
      subjects: ["Teddy bear", "Baby toy", "Children's accessories"],
    },
    {
      name: "Home & Garden",
      slug: "home-garden",
      assetKey: "home-garden" as RovexoCategoryPremiumKey,
      subjects: ["Modern chair", "Coffee table", "Floor lamp", "Indoor plant"],
    },
    {
      name: "Electronics",
      slug: "electronics",
      assetKey: "electronics" as RovexoCategoryPremiumKey,
      subjects: ["Gaming PC", "Laptop", "Monitor", "Headphones", "Tablet"],
    },
    {
      name: "Books & Media",
      slug: "books",
      assetKey: "books" as RovexoCategoryPremiumKey,
      subjects: ["Books", "Notebook", "Magazine", "E-book Reader"],
    },
    {
      name: "Hobbies & Collectables",
      slug: "collectibles",
      assetKey: "collectibles" as RovexoCategoryPremiumKey,
      subjects: [
        "Trading Cards",
        "Coins",
        "Miniature Figure",
        "Collectable Statue",
      ],
      forbiddenSubjects: ["fantasy dragons", "unrelated artwork"],
    },
    {
      name: "Sports & Outdoors",
      slug: "sports",
      assetKey: "sports" as RovexoCategoryPremiumKey,
      subjects: [
        "Football",
        "Basketball",
        "Running Shoes",
        "Dumbbells",
        "Fitness Equipment",
      ],
    },
    {
      name: "Vehicle Parts & Accessories",
      slug: "vehicle-parts",
      assetKey: "autoparts" as RovexoCategoryPremiumKey,
      subjects: [
        "Premium Alloy Wheel",
        "Ventilated Brake Disc",
        "Purple Brake Caliper",
        "LED Headlight",
        "Coilover Shock Absorber",
        "Car Battery",
        "Performance Air Filter",
        "Side Mirror",
        "Spark Plug",
      ],
      forbiddenSubjects: ["complete vehicles", "whole cars", "motorcycles as vehicles"],
    },
  ] as const,

  principles: [
    "One Platform",
    "One Design Language",
    "One Visual System",
    "One Category Style",
    "One Premium Experience",
  ] as const,
} as const;

export type SupremeBloodLawXxxvCategoryVisualIdentity =
  typeof SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1;

export type CategoryVisualIdentityCheck = {
  id: string;
  label: string;
  pass: boolean;
};

export type CategoryVisualIdentityReport = {
  ok: boolean;
  locked: boolean;
  productionReady: boolean;
  blocked: boolean;
  bloodLaw: "XXXV";
  checks: CategoryVisualIdentityCheck[];
  errors: string[];
};

function projectAsset(...segments: string[]): string {
  return workspacePath(...segments);
}

/**
 * Certify Category Visual Identity System (Blood Law XXXV).
 * Verifies subject lock + asset presence for all 10 production roots.
 * Does not redesign UI — validates the visual SSOT and on-disk assets.
 */
export function certifyCategoryVisualIdentityXxxv(): CategoryVisualIdentityReport {
  const law = SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1;
  const checks: CategoryVisualIdentityCheck[] = [];
  const errors: string[] = [];

  const add = (id: string, label: string, pass: boolean, failMessage?: string) => {
    checks.push({ id, label, pass });
    if (!pass && failMessage) errors.push(failMessage);
  };

  add(
    "locked",
    "Visual Identity Locked",
    law.locked === true && law.status === "LOCKED_PRODUCTION_READY",
    "Category Visual Identity is not locked",
  );

  add(
    "ten-roots",
    "Exactly Ten Root Visuals",
    law.rootVisuals.length === 10 && CANONICAL_ROOT_CATEGORIES.length === 10,
    "Root visual count must be 10",
  );

  add(
    "rail-keys-aligned",
    "Premium Rail Icon Keys Aligned",
    ROVEXO_CANONICAL_RAIL_ICON_KEYS.length === 10 &&
      law.rootVisuals.every((root, index) => root.assetKey === ROVEXO_CANONICAL_RAIL_ICON_KEYS[index]),
    "Canonical rail icons must match Law XXXV asset keys",
  );

  add(
    "search-heroes-aligned",
    "Search Heroes Aligned",
    SEARCH_CATEGORY_HEROES_V1.keys.length === 10 &&
      law.rootVisuals.every((root) =>
        (SEARCH_CATEGORY_HEROES_V1.keys as readonly string[]).includes(root.assetKey),
      ),
    "Search category heroes must cover all Law XXXV asset keys",
  );

  add(
    "slug-alignment",
    "Root Slug Alignment",
    law.rootVisuals.every(
      (root, index) => root.slug === CANONICAL_ROOT_CATEGORIES[index]?.slug,
    ),
    "Visual root slugs must match canonical production roots",
  );

  add(
    "vehicle-parts-no-whole-vehicles",
    "Vehicle Parts Visuals Exclude Whole Vehicles",
    law.rootVisuals
      .find((r) => r.slug === "vehicle-parts")
      ?.forbiddenSubjects?.includes("complete vehicles") === true,
    "Vehicle Parts must forbid complete vehicles in visual brief",
  );

  add(
    "collectibles-no-fantasy",
    "Collectables Visuals Exclude Fantasy Artwork",
    law.rootVisuals
      .find((r) => r.slug === "collectibles")
      ?.forbiddenSubjects?.some((s) => s.includes("fantasy")) === true,
    "Collectables must forbid fantasy dragons / unrelated artwork",
  );

  for (const root of law.rootVisuals) {
    const premiumPng = projectAsset("public", "categories", `${root.assetKey}.png`);
    const premiumWebp = projectAsset("public", "categories", `${root.assetKey}.webp`);
    const searchPng = projectAsset("public", "search", "categories", `${root.assetKey}.png`);

    const assetsOk =
      existsSync(premiumPng) && existsSync(premiumWebp) && existsSync(searchPng);

    add(
      `asset:${root.slug}`,
      `Assets Present — ${root.name}`,
      assetsOk,
      `Missing visual assets for ${root.name} (${root.assetKey})`,
    );

    add(
      `subjects:${root.slug}`,
      `Subject Brief — ${root.name}`,
      root.subjects.length >= 3,
      `Subject brief too thin for ${root.name}`,
    );
  }

  add(
    "design-language",
    "Single Design Language Declared",
    law.imageStyle.length >= 5 && law.visualPrinciples.length >= 10,
    "Visual design language incomplete",
  );

  const allPass = checks.every((c) => c.pass);

  return {
    ok: allPass,
    locked: allPass && law.locked,
    productionReady: allPass && law.productionReady,
    blocked: !allPass,
    bloodLaw: "XXXV",
    checks,
    errors,
  };
}

export function assertCategoryVisualIdentityOrBlock(): void {
  const report = certifyCategoryVisualIdentityXxxv();
  if (!report.ok) {
    throw new Error(
      `[BLOOD LAW XXXV] CATEGORY VISUAL IDENTITY CERTIFICATION FAILED — BLOCKED.\n` +
        report.errors.map((e) => ` - ${e}`).join("\n"),
    );
  }
}

export function getCategoryVisualBriefBySlug(slug: string) {
  return SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals.find(
    (root) => root.slug === slug,
  );
}
