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
  | "kids-fashion"
  | "womens-fashion"
  | "mens-fashion"
  | "shoes"
  | "cycling"
  | "more";

export type HomeCategoryNavItem = {
  name: string;
  slug: string;
  icon: HomeCategoryIconType;
  subtitle: string;
  href?: string;
};

/** Approved homepage horizontal category bar + 3D icon rail */
export const HOME_CATEGORY_NAV: HomeCategoryNavItem[] = [
  { name: "Vehicles", slug: "vehicles", icon: "vehicles", subtitle: "Cars, vans & bikes" },
  { name: "Property", slug: "property", icon: "property", subtitle: "Homes & rentals" },
  { name: "Phones", slug: "phones", icon: "phones", subtitle: "Mobile & tablets" },
  { name: "Computers", slug: "computers", icon: "computers", subtitle: "Laptops & PCs" },
  { name: "Electronics", slug: "electronics", icon: "electronics", subtitle: "Tech & gadgets" },
  { name: "Gaming", slug: "gaming", icon: "gaming", subtitle: "Consoles & games" },
  { name: "Home & Garden", slug: "home-garden", icon: "home-garden", subtitle: "Decor & outdoor" },
  { name: "DIY", slug: "diy", icon: "diy", subtitle: "Build & repair" },
  { name: "Tools", slug: "tools", icon: "tools", subtitle: "Power & hand tools" },
  { name: "Women's Fashion", slug: "womens-fashion", icon: "womens-fashion", subtitle: "Dresses & style" },
  { name: "Men's Fashion", slug: "mens-fashion", icon: "mens-fashion", subtitle: "Suits & casual" },
  { name: "Kids Fashion", slug: "kids-fashion", icon: "kids-fashion", subtitle: "Children's wear" },
  { name: "Shoes", slug: "shoes", icon: "shoes", subtitle: "Trainers & boots" },
  { name: "Jewellery", slug: "jewellery", icon: "jewellery", subtitle: "Watches & gems" },
  { name: "Beauty", slug: "beauty", icon: "beauty", subtitle: "Skincare & makeup" },
  { name: "Health", slug: "health", icon: "health", subtitle: "Wellness & care" },
  { name: "Pets", slug: "pets", icon: "pets", subtitle: "Animals & supplies" },
  { name: "Sports", slug: "sports", icon: "sports", subtitle: "Fitness & gear" },
  { name: "Services", slug: "services", icon: "services", subtitle: "Local professionals" },
  { name: "Auto Parts", slug: "car-parts", icon: "autoparts", subtitle: "Parts & accessories" },
];

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
