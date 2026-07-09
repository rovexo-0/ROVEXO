export type BuyerRetentionSurface = {
  id: string;
  label: string;
  href: string;
  description: string;
  priority: number;
};

export type BuyerRetentionPlan = {
  generatedAt: string;
  surfaces: BuyerRetentionSurface[];
  notifications: string[];
};

/** Buyer Retention Engine — deterministic surfaces to encourage return visits. */
export function buildBuyerRetentionPlan(input?: {
  hasSavedSearches?: boolean;
  hasFavorites?: boolean;
  hasRecentlyViewed?: boolean;
  hasPriceDrops?: boolean;
}): BuyerRetentionPlan {
  const surfaces: BuyerRetentionSurface[] = [
    {
      id: "continue-browsing",
      label: "Continue Browsing",
      href: "/account",
      description: "Resume where you left off with recently viewed listings.",
      priority: 100,
    },
    {
      id: "recently-viewed",
      label: "Recently Viewed",
      href: "/account",
      description: "Pick up listings you viewed recently.",
      priority: 95,
    },
    {
      id: "saved-searches",
      label: "Saved Searches",
      href: "/search?tab=saved",
      description: "Get alerts when new listings match your saved searches.",
      priority: 90,
    },
    {
      id: "favorites",
      label: "Your Favorites",
      href: "/account/saved",
      description: "Review listings you saved for later.",
      priority: 85,
    },
    {
      id: "recently-reduced",
      label: "Recently Reduced",
      href: "/collections/recently-reduced",
      description: "Price drops on listings you might like.",
      priority: 80,
    },
    {
      id: "newly-listed",
      label: "New Listings",
      href: "/collections/newly-listed",
      description: "Fresh inventory from verified sellers.",
      priority: 75,
    },
    {
      id: "trending-today",
      label: "Trending Today",
      href: "/collections/trending-today",
      description: "Discover what buyers are viewing right now.",
      priority: 70,
    },
    {
      id: "related-categories",
      label: "Browse Categories",
      href: "/categories",
      description: "Explore related categories for more options.",
      priority: 65,
    },
  ];

  const notifications: string[] = [];
  if (input?.hasPriceDrops) notifications.push("Price drop alerts enabled for saved listings");
  if (input?.hasSavedSearches) notifications.push("New listing alerts for saved searches");
  if (input?.hasFavorites) notifications.push("Updates on your favorite listings");
  if (input?.hasRecentlyViewed) notifications.push("Continue where you left off");

  if (!notifications.length) {
    notifications.push(
      "Save searches to get new listing notifications",
      "Favorite listings to track price drops",
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    surfaces: surfaces.sort((a, b) => b.priority - a.priority),
    notifications,
  };
}
