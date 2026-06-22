/** Short SEO URL aliases to canonical category slug paths. */
export const CATEGORY_ALIASES: Record<string, string[]> = {
  cars: ["vehicles", "cars"],
  car: ["vehicles", "cars"],
  vans: ["vehicles", "vans-trucks"],
  bikes: ["cycling", "bikes"],
  phones: ["phones"],
  phone: ["phones", "smartphones"],
  laptops: ["computers", "laptops"],
  computers: ["computers"],
  gaming: ["gaming"],
  furniture: ["home-garden", "furniture"],
  bedding: ["home-garden", "bedding"],
  duvets: ["home-garden", "bedding", "duvets"],
  tools: ["tools"],
  "power-tools": ["tools", "power-tools"],
  fashion: ["womens-fashion"],
  shoes: ["shoes"],
  watches: ["jewellery", "watches"],
  pets: ["pets"],
  sports: ["sports"],
  books: ["books"],
  tickets: ["tickets"],
  jobs: ["jobs"],
  free: ["free-stuff"],
};

export const CONDITION_SLUGS = new Set(["new", "like-new", "good", "fair", "for-parts", "refurbished"]);

export const PRICE_RANGE_SLUGS: Record<string, { min?: number; max?: number; label: string }> = {
  "under-50": { max: 50, label: "Under £50" },
  "50-100": { min: 50, max: 100, label: "£50 – £100" },
  "100-250": { min: 100, max: 250, label: "£100 – £250" },
  "250-500": { min: 250, max: 500, label: "£250 – £500" },
  "500-1000": { min: 500, max: 1000, label: "£500 – £1,000" },
  "over-1000": { min: 1000, label: "Over £1,000" },
};

export function resolveCategoryAlias(segment: string): string[] | null {
  return CATEGORY_ALIASES[segment] ?? null;
}
