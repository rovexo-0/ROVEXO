export type HomeCategoryIconType =
  | "vehicles"
  | "property"
  | "phones"
  | "computers"
  | "electronics"
  | "gaming"
  | "fashion"
  | "furniture"
  | "home-garden"
  | "sports"
  | "pets"
  | "jobs"
  | "services"
  | "autoparts"
  | "wholesale"
  | "auctions"
  | "beauty"
  | "health"
  | "baby"
  | "jewellery"
  | "diy"
  | "tools"
  | "kids"
  | "kids-fashion"
  | "womens-fashion"
  | "mens-fashion"
  | "shoes"
  | "cycling"
  | "business"
  | "luxury"
  | "collectibles"
  | "handmade"
  | "more";

import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";
import { heroCampaignImage } from "@/lib/home/hero-images";

export type HomeCategoryNavItem = {
  name: string;
  slug: string;
  icon: HomeCategoryIconType;
  subtitle: string;
  href?: string;
};

/** Approved homepage horizontal category bar — assets from category-premium-library */
export const HOME_CATEGORY_NAV: HomeCategoryNavItem[] = [...ROVEXO_HOME_CATEGORY_RAIL];

/** @deprecated Use HOME_CATEGORY_NAV */
export type HomeCategoryRailItem = HomeCategoryNavItem;

/** @deprecated Use HOME_CATEGORY_NAV */
export const HOME_CATEGORY_RAIL: HomeCategoryNavItem[] = HOME_CATEGORY_NAV;

export type HomeQuickFilter = {
  id: string;
  label: string;
  href: string;
};

export const HOME_QUICK_FILTERS: HomeQuickFilter[] = [
  { id: "near-me", label: "Near me", href: "/search?q=&sort=nearby" },
  { id: "new-today", label: "New today", href: "/search?q=&sort=newest" },
  { id: "verified", label: "Verified", href: "/search?q=&verified=1" },
  { id: "top-rated", label: "Top rated", href: "/search?q=&sort=rating" },
  { id: "just-listed", label: "Just listed", href: "/search?q=&sort=recent" },
  { id: "deals", label: "Best deals", href: "/search?q=&deals=1" },
];

export type HomePromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  categorySlug: string;
  accent: string;
};

export const HOME_PROMO_SLIDES: HomePromoSlide[] = [
  {
    id: "protection",
    title: "Buyer protection on every order",
    subtitle: "Shop with verified sellers and secure checkout.",
    href: "/trust",
    categorySlug: "fashion",
    accent: "from-primary/90 via-primary to-primary-deep",
  },
  {
    id: "sell",
    title: "List for free on ROVEXO",
    subtitle: "Add photos, set your price, and reach buyers across the UK.",
    href: "/sell",
    categorySlug: "electronics",
    accent: "from-indigo-600 via-primary to-sky-600",
  },
  {
    id: "deals",
    title: "Best deals near you",
    subtitle: "Discover verified listings with top ratings.",
    href: "/search?q=&deals=1",
    categorySlug: "vehicles",
    accent: "from-sky-600 via-primary to-blue-700",
  },
];

export type HomeSecondaryBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

export type HomeHeroBannerTheme = "blue" | "indigo" | "violet" | "cyan" | "emerald";

export type HomeHeroBannerSlide = {
  id: string;
  title: string;
  subtitle?: string;
  cta: string;
  href: string;
  headingId?: string;
  theme?: HomeHeroBannerTheme;
  icon?: HomeCategoryIconType;
  categoryKey?: RovexoCategoryPremiumKey;
  /** Premium campaign photography (lazy-loaded, next slide preloaded) */
  image?: string;
};

/** Launch Candidate hero campaigns — local assets in public/hero/ only */
export const HOME_HERO_BANNERS: HomeHeroBannerSlide[] = [
  {
    id: "move-store",
    title: "Move Your Entire Store to ROVEXO",
    subtitle: "Import listings from any marketplace in minutes.",
    cta: "Start import",
    href: "/import-wizard",
    theme: "blue",
    icon: "services",
    categoryKey: "services",
    image: heroCampaignImage("move-store"),
  },
  {
    id: "zero-fees",
    title: "Zero Listing Fees",
    subtitle: "List today with no upfront charges on ROVEXO.",
    cta: "List free",
    href: "/sell",
    theme: "violet",
    icon: "services",
    categoryKey: "services",
    image: heroCampaignImage("zero-fees"),
  },
  {
    id: "verified-businesses",
    title: "Verified Businesses",
    subtitle: "Professional storefronts, warehouses and suppliers.",
    cta: "Browse directory",
    href: "/business/directory",
    theme: "blue",
    icon: "services",
    categoryKey: "services",
    image: heroCampaignImage("verified-businesses"),
  },
  {
    id: "buy-securely",
    title: "Buyer Protection",
    subtitle: "Shield, verified sellers, safe delivery on every order.",
    cta: "Learn more",
    href: "/trust",
    theme: "cyan",
    icon: "health",
    categoryKey: "health",
    image: heroCampaignImage("buy-securely"),
  },
  {
    id: "fast-delivery",
    title: "Fast Delivery",
    subtitle: "Trusted sellers. Quick shipping across the UK.",
    cta: "Shop now",
    href: "/search?q=&sort=trending",
    theme: "emerald",
    icon: "vehicles",
    categoryKey: "vehicles",
    image: heroCampaignImage("fast-delivery"),
  },
  {
    id: "electronics-deals",
    title: "Local Marketplace",
    subtitle: "Discover trusted sellers and unique finds near you.",
    cta: "Explore nearby",
    href: "/search?q=&sort=nearby",
    theme: "indigo",
    icon: "electronics",
    categoryKey: "electronics",
    image: heroCampaignImage("electronics-deals"),
  },
  {
    id: "home-garden",
    title: "Sell in Minutes",
    subtitle: "List from your phone with photos, price, and category in one flow.",
    cta: "Start selling",
    href: "/sell/new",
    theme: "emerald",
    icon: "phones",
    categoryKey: "phones",
    image: heroCampaignImage("home-garden"),
  },
  {
    id: "premium-auctions",
    title: "Grow Your Business",
    subtitle: "Reach buyers across the UK with verified storefronts and analytics.",
    cta: "Open store",
    href: "/business/center",
    theme: "violet",
    icon: "services",
    categoryKey: "services",
    image: heroCampaignImage("premium-auctions"),
  },
];

export const HOME_SECONDARY_BANNERS: HomeSecondaryBanner[] = [
  {
    id: "bring-items",
    title: "Bring Your Items",
    subtitle: "Import your entire store in minutes.",
    cta: "Start import",
    href: "/import-wizard",
  },
  {
    id: "start-selling",
    title: "Start Selling",
    subtitle: "Reach millions of buyers across Europe.",
    cta: "Sell now",
    href: "/sell/new",
  },
  {
    id: "buyer-protection",
    title: "Buyer Protection",
    subtitle: "Secure checkout on every order.",
    cta: "Learn more",
    href: "/trust",
  },
  {
    id: "fast-delivery",
    title: "Fast Delivery",
    subtitle: "Trusted sellers. Quick shipping.",
    cta: "Shop now",
    href: "/search?q=&sort=trending",
  },
  {
    id: "verified-sellers",
    title: "Verified Sellers",
    subtitle: "Shop with confidence across ROVEXO.",
    cta: "Explore",
    href: "/trust",
  },
  {
    id: "secure-payments",
    title: "Secure Payments",
    subtitle: "Encrypted checkout & protection.",
    cta: "Learn more",
    href: "/trust",
  },
  {
    id: "zero-fees",
    title: "Zero Listing Fees",
    subtitle: "List today with no upfront charges.",
    cta: "List free",
    href: "/sell",
  },
];
