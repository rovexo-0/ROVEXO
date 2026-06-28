import type { HomepageSection, HomepageSectionType } from "@/lib/homepage-builder-engine/types";
import { HOMEPAGE_SECTION_TYPES } from "@/lib/homepage-builder-engine/registry";

const SECTION_LABELS: Record<HomepageSectionType, string> = {
  "hero-banner": "Hero Banner",
  categories: "Categories",
  "featured-listings": "Featured Listings",
  recommended: "Recommended",
  trending: "Trending",
  "ai-picks": "AI Picks",
  "business-spotlight": "Business Spotlight",
  "flash-deals": "Flash Deals",
  auctions: "Auctions",
  "recently-viewed": "Recently Viewed",
  "continue-browsing": "Continue Browsing",
  brands: "Brands",
  collections: "Collections",
  "new-sellers": "New Sellers",
  "recommended-shops": "Recommended Shops",
  promotions: "Promotions",
  coupons: "Coupons",
  statistics: "Statistics",
  newsletter: "Newsletter",
  footer: "Footer",
  "custom-section": "Custom Section",
  "html-block": "HTML Block",
  "markdown-block": "Markdown Block",
  widget: "Widget",
  "ai-widget": "AI Widget",
  "video-banner": "Video Banner",
  gallery: "Gallery",
  "announcement-bar": "Announcement Bar",
  "sticky-banner": "Sticky Banner",
  "floating-cta": "Floating CTA",
  countdown: "Countdown",
  reviews: "Reviews",
  testimonials: "Testimonials",
  faq: "FAQ",
};

export function defaultSectionSettings(): HomepageSection["settings"] {
  return {
    visibility: {
      desktop: true,
      tablet: true,
      mobile: true,
      countries: [],
      languages: [],
      loggedUser: true,
      guest: true,
      buyer: true,
      seller: true,
      business: true,
      premium: true,
      subscription: true,
    },
    rolloutPercent: 100,
  };
}

export function createSection(type: HomepageSectionType, order: number): HomepageSection {
  return {
    id: `section-${type}-${order}`,
    type,
    label: SECTION_LABELS[type],
    order,
    enabled: true,
    hidden: false,
    locked: false,
    pinned: false,
    published: false,
    settings: defaultSectionSettings(),
    style: {},
    content: {},
  };
}

export function createDefaultHomepageSections(): HomepageSection[] {
  return HOMEPAGE_SECTION_TYPES.map((type, index) => createSection(type, index));
}

export function getSectionLabel(type: HomepageSectionType): string {
  return SECTION_LABELS[type];
}

export function isValidSectionType(type: string): type is HomepageSectionType {
  return (HOMEPAGE_SECTION_TYPES as readonly string[]).includes(type);
}

export function filterVisibleSections(
  sections: HomepageSection[],
  device: "desktop" | "tablet" | "mobile",
): HomepageSection[] {
  return sections.filter(
    (s) => s.enabled && !s.hidden && s.settings.visibility[device],
  );
}
