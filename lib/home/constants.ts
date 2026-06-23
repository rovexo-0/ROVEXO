export type HomeCategoryRailItem = {
  name: string;
  slug: string;
  icon: string;
};

export const HOME_CATEGORY_RAIL: HomeCategoryRailItem[] = [
  { name: "Vehicles", slug: "vehicles", icon: "🚗" },
  { name: "Property", slug: "property", icon: "🏠" },
  { name: "Phones", slug: "electronics", icon: "📱" },
  { name: "Computers", slug: "electronics", icon: "💻" },
  { name: "Fashion", slug: "fashion", icon: "👗" },
  { name: "More", slug: "", icon: "✨" },
];

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
