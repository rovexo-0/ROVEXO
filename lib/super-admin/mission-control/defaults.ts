import { HOME_HERO_BANNERS } from "@/lib/home/constants";
import type {
  BannerManagerConfig,
  HomepageBuilderConfig,
  MissionControlAiToggle,
  MissionControlFeatureToggle,
} from "@/lib/super-admin/mission-control/types";

export const HOMEPAGE_BUILDER_SETTING_KEY = "mission_control_homepage_builder_v1";
export const BANNER_MANAGER_SETTING_KEY = "mission_control_banners_v1";
export const FEATURE_MANAGER_SETTING_KEY = "mission_control_features_v1";
export const AI_MANAGER_SETTING_KEY = "mission_control_ai_v1";

export function createDefaultHomepageBuilderConfig(): HomepageBuilderConfig {
  const components: HomepageBuilderConfig["components"] = [
    { id: "header", label: "Header", enabled: true, published: true, order: 0, visibility: { desktop: true, tablet: true, mobile: true }, style: { padding: 16, gap: 12 } },
    { id: "search", label: "Search", enabled: true, published: true, order: 1, visibility: { desktop: true, tablet: true, mobile: true }, style: { height: 48, borderRadius: 999 } },
    { id: "top-category-bar", label: "Top Category Bar", enabled: false, published: false, order: 2, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 8 } },
    { id: "category-rail", label: "Category Rail", enabled: true, published: true, order: 3, visibility: { desktop: true, tablet: true, mobile: true }, style: { gap: 12, iconSize: 80 } },
    { id: "bring-items", label: "Bring Your Items", enabled: false, published: false, order: 4, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 8 } },
    { id: "popular-auctions", label: "Popular Auctions", enabled: false, published: false, order: 5, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 12 } },
    { id: "featured-listings", label: "Featured Listings", enabled: false, published: false, order: 6, visibility: { desktop: false, tablet: false, mobile: false }, style: { columns: 5, gap: 16 } },
    { id: "recommended", label: "Recommended", enabled: false, published: false, order: 7, visibility: { desktop: false, tablet: false, mobile: false }, style: { columns: 4, gap: 16 } },
    { id: "new-listings", label: "New Listings", enabled: false, published: false, order: 8, visibility: { desktop: false, tablet: false, mobile: false }, style: { columns: 4, gap: 16 } },
    { id: "latest-listings", label: "Latest Listings", enabled: false, published: false, order: 9, visibility: { desktop: false, tablet: false, mobile: false }, style: { columns: 4, gap: 16 } },
    { id: "trending-listings", label: "Trending", enabled: false, published: false, order: 10, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 16 } },
    { id: "all-listings", label: "All Listings", enabled: true, published: true, order: 11, visibility: { desktop: true, tablet: true, mobile: true }, style: { gap: 16 } },
    { id: "continue-browsing", label: "Recently Viewed", enabled: false, published: false, order: 12, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 16 } },
    { id: "trending-searches", label: "Trending Searches", enabled: false, published: false, order: 13, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 12 } },
    { id: "hero-slider", label: "Hero Slider", enabled: false, published: false, order: 14, visibility: { desktop: false, tablet: false, mobile: false }, style: { height: 360, borderRadius: 24 } },
    { id: "business-spotlight", label: "Business Spotlight", enabled: false, published: false, order: 15, visibility: { desktop: false, tablet: false, mobile: false }, style: { gap: 16 } },
    { id: "footer", label: "Footer", enabled: false, published: false, order: 16, visibility: { desktop: false, tablet: false, mobile: false }, style: { padding: 24 } },
    { id: "bottom-navigation", label: "Bottom Navigation", enabled: true, published: true, order: 17, visibility: { desktop: false, tablet: true, mobile: true }, style: { height: 72 } },
  ];

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    components,
  };
}

export function createDefaultBannerManagerConfig(): BannerManagerConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    banners: HOME_HERO_BANNERS.map((banner, index) => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      cta: banner.cta,
      href: banner.href,
      image: banner.image,
      enabled: true,
      published: true,
      order: index,
      transitionMs: 600,
    })),
  };
}

export function createDefaultFeatureToggles(): MissionControlFeatureToggle[] {
  return [
    { id: "auctions", label: "Auctions", description: "Live auction marketplace module", enabled: false, state: "coming-soon", version: "1.0" },
    { id: "wholesale", label: "Wholesale", description: "B2B wholesale directory and RFQ", enabled: true, state: "live", version: "1.2" },
    { id: "voice-search", label: "Voice Search", description: "Voice-assisted search on mobile", enabled: false, state: "beta", version: "0.9" },
    { id: "import-wizard", label: "Store Import", description: "Seller migration wizard", enabled: true, state: "live", version: "1.4" },
    { id: "buyer-protection", label: "Buyer Protection", description: "Trust and resolution centre", enabled: true, state: "live", version: "1.0" },
    { id: "business-directory", label: "Business Directory", description: "Verified business storefronts", enabled: true, state: "live", version: "1.1" },
  ];
}

export function createDefaultAiToggles(): { globalEnabled: boolean; features: MissionControlAiToggle[] } {
  return {
    globalEnabled: true,
    features: [
      { id: "sell-item", label: "Sell Item Assistant", description: "Listing creation guidance", enabled: true, execution: "local" },
      { id: "bring-items", label: "Bring Your Items", description: "Import listing suggestions", enabled: true, execution: "hybrid" },
      { id: "search", label: "Search Assistant", description: "Query understanding and filters", enabled: true, execution: "server" },
      { id: "messages", label: "Messages", description: "Smart reply suggestions", enabled: false, execution: "local" },
      { id: "translation", label: "Translation", description: "Cross-language listing support", enabled: true, execution: "local" },
      { id: "category-detection", label: "Category Detection", description: "Title-to-category mapping", enabled: true, execution: "local" },
      { id: "image-recognition", label: "Image Recognition", description: "Camera listing analysis", enabled: true, execution: "local" },
      { id: "price-suggestions", label: "Price Suggestions", description: "Market-aware pricing hints", enabled: true, execution: "hybrid" },
      { id: "description-generator", label: "Description Generator", description: "Listing copy assistance", enabled: true, execution: "local" },
      { id: "title-generator", label: "Title Generator", description: "SEO-friendly title suggestions", enabled: true, execution: "local" },
    ],
  };
}

export const NOTIFICATION_PRIORITY_LEGEND = [
  { severity: "info" as const, label: "Information", color: "blue" },
  { severity: "success" as const, label: "Success", color: "green" },
  { severity: "warning" as const, label: "Warning", color: "yellow" },
  { severity: "high" as const, label: "High Priority", color: "orange" },
  { severity: "critical" as const, label: "Critical", color: "red" },
  { severity: "emergency" as const, label: "Emergency", color: "black" },
];
