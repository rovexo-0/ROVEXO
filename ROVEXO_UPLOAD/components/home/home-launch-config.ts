/** Homepage launch layout constants — composition only. */
export const HOME_LAUNCH_SECTION_CARD_LIMIT = 6;

export const HOME_LAUNCH_VIEW_ALL_LABEL = "View All";

export const HOME_LAUNCH_VIEW_ALL_HREFS = {
  auctions: "/auctions",
  featured: "/search?q=&sort=popular",
  recommended: "/search?q=&sort=recommended",
  newListings: "/search?q=&sort=newest",
  latestListings: "/search?q=&sort=trending",
  trending: "/search?q=&sort=trending",
} as const;
