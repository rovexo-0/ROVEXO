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
    id: "vehicles",
    title: "Premium Vehicles",
    subtitle: "Cars, vans & motorcycles from verified sellers.",
    cta: "Browse vehicles",
    href: "/category/vehicles",
    theme: "blue",
    icon: "vehicles",
    categoryKey: "vehicles",
    image: heroCampaignImage("vehicles"),
  },
  {
    id: "property",
    title: "Property & Rentals",
    subtitle: "Homes, flats, and commercial spaces across Europe.",
    cta: "Explore property",
    href: "/category/property",
    theme: "indigo",
    icon: "property",
    categoryKey: "property",
    image: heroCampaignImage("property"),
  },
  {
    id: "phones",
    title: "Phones & Tablets",
    subtitle: "Flagship devices from trusted sellers.",
    cta: "Shop phones",
    href: "/category/phones",
    theme: "cyan",
    icon: "phones",
    categoryKey: "phones",
    image: heroCampaignImage("phones"),
  },
  {
    id: "computers",
    title: "Computers & Laptops",
    subtitle: "Work, study, and create with premium tech.",
    cta: "Browse computers",
    href: "/category/computers",
    theme: "violet",
    icon: "computers",
    categoryKey: "computers",
    image: heroCampaignImage("computers"),
  },
  {
    id: "electronics",
    title: "Electronics & Tech",
    subtitle: "Headphones, gadgets, and smart devices.",
    cta: "Shop electronics",
    href: "/category/electronics",
    theme: "violet",
    icon: "electronics",
    categoryKey: "electronics",
    image: heroCampaignImage("electronics"),
  },
  {
    id: "fashion",
    title: "Luxury Fashion",
    subtitle: "Designer pieces and premium streetwear.",
    cta: "Shop fashion",
    href: "/category/fashion",
    theme: "cyan",
    icon: "fashion",
    categoryKey: "fashion",
    image: heroCampaignImage("fashion"),
  },
  {
    id: "home-garden",
    title: "Home & Garden",
    subtitle: "Furniture, décor, and outdoor living.",
    cta: "Discover home",
    href: "/category/home-garden",
    theme: "emerald",
    icon: "home-garden",
    categoryKey: "home-garden",
    image: heroCampaignImage("home-garden"),
  },
  {
    id: "luxury",
    title: "Luxury & Collectibles",
    subtitle: "Watches, gems, and collector pieces.",
    cta: "View luxury",
    href: "/category/luxury",
    theme: "violet",
    icon: "luxury",
    categoryKey: "luxury",
    image: heroCampaignImage("luxury"),
  },
  {
    id: "verified-sellers",
    title: "Verified Sellers",
    subtitle: "Shop with confidence across ROVEXO.",
    cta: "Browse verified",
    href: "/search?q=&verified=1",
    theme: "blue",
    icon: "services",
    categoryKey: "services",
    image: heroCampaignImage("verified-sellers"),
  },
  {
    id: "auctions",
    title: "Live Auctions",
    subtitle: "Bid on exclusive items ending soon.",
    cta: "Place a bid",
    href: "/auctions",
    theme: "blue",
    icon: "auctions",
    image: heroCampaignImage("auctions"),
  },
  {
    id: "seasonal",
    title: "Seasonal Promotions",
    subtitle: "Curated deals for this season.",
    cta: "Shop deals",
    href: "/search?q=&sort=trending",
    theme: "emerald",
    icon: "sports",
    categoryKey: "sports",
    image: heroCampaignImage("seasonal"),
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
