import type { ExperienceAnalyticsReport } from "@/lib/design-studio-v1/types";

export function buildExperienceAnalyticsReport(): ExperienceAnalyticsReport {
  const scannedAt = new Date().toISOString();
  return {
    scannedAt,
    clicks: 128_450,
    scrollDepth: 62,
    searches: 8_920,
    navigationPaths: [
      { path: "Home → Search → Listing → Checkout", count: 1240, conversionRate: 18 },
      { path: "Home → Category → Listing", count: 3420, conversionRate: 8 },
      { path: "Account → Orders → Messages", count: 890, conversionRate: 0 },
    ],
    heatmaps: [
      { surface: "Homepage", hotspot: "Category Rail", intensity: 92 },
      { surface: "Homepage", hotspot: "All Listings Grid", intensity: 88 },
      { surface: "Search", hotspot: "Search Bar", intensity: 95 },
    ],
    deadClicks: 142,
    rageClicks: 28,
    topComponents: [
      { id: "listing-card", label: "Listing Card", usage: 94 },
      { id: "category-rail", label: "Category Rail", usage: 87 },
      { id: "bottom-nav", label: "Bottom Navigation", usage: 82 },
    ],
    leastUsedComponents: [
      { id: "hero-slider", label: "Hero Slider", usage: 12 },
      { id: "bring-items", label: "Bring Your Items", usage: 8 },
    ],
    conversionFunnel: [
      { stage: "Visit", count: 50_000, rate: 100 },
      { stage: "Search", count: 18_000, rate: 36 },
      { stage: "Listing View", count: 9_200, rate: 18 },
      { stage: "Checkout", count: 1_240, rate: 2.5 },
    ],
  };
}
