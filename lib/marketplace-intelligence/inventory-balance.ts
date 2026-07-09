import { createAdminClient } from "@/lib/supabase/admin";
import { buildSearchInsightsReport } from "@/lib/organic-growth/search-insights";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import { MARKETPLACE_BRANDS } from "@/lib/categories/enterprise/brands";
import type { InventoryGap } from "@/lib/marketplace-intelligence/types";

/** Inventory Balance Engine — detects supply/demand gaps across dimensions. */
export async function evaluateInventoryBalance(): Promise<InventoryGap[]> {
  const gaps: InventoryGap[] = [];
  const insights = await buildSearchInsightsReport();

  for (const entry of insights.noResultSearches.slice(0, 10)) {
    gaps.push({
      id: `search-gap-${entry.term.replace(/\s+/g, "-")}`,
      dimension: "category",
      label: entry.term,
      supply: entry.inventoryCount,
      demand: entry.searchCount,
      gapRatio: entry.searchCount / Math.max(1, entry.inventoryCount),
      severity: entry.searchCount > 5 ? "high" : "medium",
    });
  }

  for (const entry of insights.lowInventorySearches.slice(0, 8)) {
    gaps.push({
      id: `low-inv-${entry.term.replace(/\s+/g, "-")}`,
      dimension: "category",
      label: entry.term,
      supply: entry.inventoryCount,
      demand: entry.searchCount,
      gapRatio: entry.searchCount / Math.max(1, entry.inventoryCount),
      severity: "medium",
    });
  }

  try {
    const admin = createAdminClient();
    for (const alias of Object.keys(CATEGORY_ALIASES).slice(0, 6)) {
      const { count } = await admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .ilike("title", `%${alias.replace(/-/g, " ")}%`);
      const supply = count ?? 0;
      if (supply < 5) {
        gaps.push({
          id: `cat-shortage-${alias}`,
          dimension: "category",
          label: alias.replace(/-/g, " "),
          supply,
          demand: 10,
          gapRatio: 10 / Math.max(1, supply),
          severity: supply === 0 ? "high" : "low",
        });
      }
    }

    for (const brand of MARKETPLACE_BRANDS.slice(0, 5)) {
      const { count } = await admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .ilike("title", `%${brand}%`);
      const supply = count ?? 0;
      if (supply < 3) {
        gaps.push({
          id: `brand-gap-${brand.toLowerCase().replace(/\s+/g, "-")}`,
          dimension: "brand",
          label: brand,
          supply,
          demand: 8,
          gapRatio: 8 / Math.max(1, supply),
          severity: "medium",
        });
      }
    }

    for (const location of ALL_UK_LOCATIONS.slice(0, 5)) {
      const { count } = await admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .eq("location_city", location.name);
      const supply = count ?? 0;
      if (supply < 5) {
        gaps.push({
          id: `loc-gap-${location.slug}`,
          dimension: "location",
          label: location.name,
          supply,
          demand: 6,
          gapRatio: 6 / Math.max(1, supply),
          severity: "low",
        });
      }
    }
  } catch {
    // DB optional in tests
  }

  return gaps.sort((a, b) => b.gapRatio - a.gapRatio).slice(0, 25);
}
