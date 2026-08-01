import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";

export type TitleCategoryRule = {
  /** Match when every pattern appears in the normalized title (supports | alternates). */
  patterns: string[];
  path: [string, string, string?];
  confidence: number;
  /** Optional brand boost when brand token present. */
  brands?: string[];
};

/**
 * High-precision title → category mappings for the sell flow.
 * Slugs must exist in the marketplace tree.
 */
export const TITLE_CATEGORY_RULES: TitleCategoryRule[] = [
  {
    patterns: ["iphone", "pro max|pro|plus|mini"],
    path: ["phones", "smartphones", "unlocked-phones"],
    confidence: 0.97,
    brands: ["apple"],
  },
  {
    patterns: ["iphone"],
    path: ["phones", "smartphones", "unlocked-phones"],
    confidence: 0.96,
    brands: ["apple"],
  },
  {
    patterns: ["samsung galaxy", "galaxy s|galaxy a|galaxy z|galaxy s25"],
    path: ["phones", "smartphones", "unlocked-phones"],
    confidence: 0.96,
    brands: ["samsung"],
  },
  {
    patterns: ["magic mouse|apple mouse"],
    path: ["computers", "computer-accessories", "mice"],
    confidence: 0.94,
    brands: ["apple"],
  },
  {
    patterns: ["nike", "air max 270|air max|air force|dunk|trainers|sneakers"],
    path: ["shoes", "trainers", "nike"],
    confidence: 0.97,
    brands: ["nike"],
  },
  {
    patterns: ["ps5", "playstation 5|playstation5|ps5 console"],
    path: ["gaming", "consoles", "playstation"],
    confidence: 0.94,
  },
  {
    patterns: ["bmw", "front bumper|rear bumper|f30 bumper|bumper"],
    path: ["car-parts", "body-parts", "bumpers"],
    confidence: 0.92,
    brands: ["bmw"],
  },
  {
    patterns: ["sofa|couch|chesterfield|settee|leather sofa"],
    path: ["home-garden", "furniture", "sofas"],
    confidence: 0.93,
  },
  {
    patterns: ["dining table|oak table|kitchen table|wooden table"],
    path: ["home-garden", "furniture", "tables"],
    confidence: 0.92,
  },
  {
    patterns: ["smartphone|mobile phone|android phone"],
    path: ["phones", "smartphones", "unlocked-phones"],
    confidence: 0.94,
  },
  {
    patterns: ["bosch", "drill|combi drill|hammer drill"],
    path: ["tools", "power-tools", "drills"],
    confidence: 0.96,
    brands: ["bosch"],
  },
  {
    patterns: ["dewalt", "drill|impact driver|combi drill"],
    path: ["tools", "power-tools", "drills"],
    confidence: 0.95,
    brands: ["dewalt"],
  },
  {
    patterns: ["makita", "drill|driver|combi drill"],
    path: ["tools", "power-tools", "drills"],
    confidence: 0.95,
    brands: ["makita"],
  },
  {
    patterns: ["power drill|cordless drill|electric drill|combi drill"],
    path: ["tools", "power-tools", "drills"],
    confidence: 0.94,
  },
  {
    patterns: ["adidas", "ultraboost|stan smith|trainers|sneakers"],
    path: ["shoes", "trainers", "adidas"],
    confidence: 0.96,
    brands: ["adidas"],
  },
  {
    patterns: ["trainers|sneakers|running shoes"],
    path: ["shoes", "trainers", "nike"],
    confidence: 0.91,
  },
  {
    patterns: ["bmw", "alloy wheels|alloys|wheel set"],
    path: ["car-parts", "wheels-tyres", "alloy-wheels"],
    confidence: 0.97,
    brands: ["bmw"],
  },
  {
    patterns: ["alloy wheels|alloys|alloy rim"],
    path: ["car-parts", "wheels-tyres", "alloy-wheels"],
    confidence: 0.95,
  },
  {
    patterns: ["audi", "alloy wheels|alloys"],
    path: ["car-parts", "wheels-tyres", "alloy-wheels"],
    confidence: 0.96,
    brands: ["audi"],
  },
  {
    patterns: ["macbook|mac book"],
    path: ["computers", "laptops", "macbooks"],
    confidence: 0.97,
    brands: ["apple"],
  },
  {
    patterns: ["laptop|notebook|chromebook"],
    path: ["computers", "laptops", "macbooks"],
    confidence: 0.92,
  },
  {
    // `TITLE_SYNONYMS` expands ps5/ps4 → "playstation" before rules run, so
    // match the normalized "playstation" token (covers PlayStation 5, PS5,
    // PS5 Slim, PS4). Patterns are AND-combined, so this must be a single token.
    patterns: ["playstation"],
    path: ["gaming", "consoles", "playstation"],
    confidence: 0.96,
  },
  {
    patterns: ["xbox", "series x|series s|xbox one"],
    path: ["gaming", "consoles", "xbox"],
    confidence: 0.95,
  },
  {
    patterns: ["nintendo switch|switch oled|switch lite"],
    path: ["gaming", "consoles", "nintendo"],
    confidence: 0.94,
  },
  {
    patterns: ["ps5 slim|playstation 5 slim"],
    path: ["gaming", "consoles", "playstation"],
    confidence: 0.95,
  },
  {
    patterns: ["dyson", "vacuum|hoover|cordless vacuum"],
    path: ["appliances", "cleaning-appliances", "vacuum-cleaners"],
    confidence: 0.95,
    brands: ["dyson"],
  },
  {
    patterns: ["airpods|airpods pro|airpods max|airpods pro 2"],
    path: ["electronics", "audio", "earbuds"],
    confidence: 0.96,
    brands: ["apple"],
  },
  {
    patterns: ["canon", "eos r6|eos r5|eos r|mirrorless"],
    path: ["electronics", "cameras", "mirrorless"],
    confidence: 0.95,
    brands: ["canon"],
  },
  {
    patterns: ["dji", "mini 4 pro|mini 3|mavic|drone|fpv"],
    path: ["electronics", "cameras", "drones"],
    confidence: 0.95,
    brands: ["dji"],
  },
  {
    patterns: ["gaming monitor|curved gaming monitor|144hz monitor|240hz monitor"],
    path: ["computers", "computer-accessories", "monitors"],
    confidence: 0.94,
  },
  {
    patterns: ["office chair|desk chair|ergonomic chair|task chair"],
    path: ["office", "office-furniture", "office-chairs"],
    confidence: 0.93,
  },
  {
    patterns: ["baby stroller|pushchair|pram|travel system|buggy"],
    path: ["baby", "pushchairs", "prams"],
    confidence: 0.94,
  },
  {
    // Single pattern with | alternates — AND across patterns would require both tokens.
    patterns: ["lego|duplo"],
    path: ["toys", "building-toys", "lego"],
    confidence: 0.96,
  },
  {
    patterns: ["car seat", "isofix", "infant seat"],
    path: ["baby", "pushchairs", "travel-systems"],
    confidence: 0.95,
  },
  {
    patterns: ["mountain bike|mtb|mountain bicycle"],
    path: ["cycling", "bikes", "mountain-bikes"],
    confidence: 0.95,
  },
  {
    patterns: ["road bike|road bicycle|racing bike"],
    path: ["cycling", "bikes", "road-bikes"],
    confidence: 0.93,
  },
  {
    patterns: ["sleeping bag", "sleeping-bag", "sleeping bags", "camp sleeping"],
    path: ["sports", "camping", "sleeping-bags"],
    confidence: 0.97,
  },
  {
    patterns: ["camping tent", "camping tents", "family tent", "dome tent"],
    path: ["sports", "camping", "camping-tents"],
    confidence: 0.96,
  },
  {
    patterns: ["memory foam pillow", "memory-foam pillow"],
    path: ["home-garden", "pillows-cushions", "memory-foam-pillows"],
    confidence: 0.97,
  },
  {
    patterns: ["pregnancy pillow"],
    path: ["home-garden", "pillows-cushions", "pregnancy-pillows"],
    confidence: 0.97,
  },
  {
    patterns: ["maternity pillow"],
    path: ["home-garden", "pillows-cushions", "maternity-pillows"],
    confidence: 0.97,
  },
  {
    patterns: ["handbag", "tote bag", "designer bag"],
    path: ["womens-fashion", "bags", "handbags"],
    confidence: 0.92,
  },
  {
    patterns: ["watch", "smartwatch", "apple watch"],
    path: ["phones", "wearables", "smartwatches"],
    confidence: 0.93,
  },
  {
    patterns: ["smart tv|oled tv|oled smart tv|qled tv|4k tv|television"],
    path: ["electronics", "tv-video", "televisions"],
    confidence: 0.96,
  },
  {
    patterns: ["winter tyres|summer tyres|all season tyres|car tyres|tyres 225|tyres 205"],
    path: ["car-parts", "wheels-tyres", "tyres"],
    confidence: 0.95,
  },
  {
    patterns: ["tyres|tires"],
    path: ["car-parts", "wheels-tyres", "tyres"],
    confidence: 0.91,
  },
  {
    // Deliberately avoids the bare "book" token so "macbook"/"notebook" (laptops)
    // are never misread as Books. Maps clear book signals to a canonical genre.
    patterns: ["paperback|hardback|crime fiction|crime novel|romance novel|fantasy novel|sci-fi novel|thriller novel|graphic novel|comic book|manga"],
    path: ["books", "fiction", "crime"],
    confidence: 0.9,
  },
  {
    patterns: ["plush|soft toy|teddy|teddy bear|cuddly|stuffed animal|stuffed toy"],
    path: ["baby", "baby-toys", "soft-toys"],
    confidence: 0.9,
  },
];

/** Common abbreviations and synonyms expanded before matching. */
export const TITLE_SYNONYMS: Record<string, string> = {
  tv: "television",
  telly: "television",
  mobile: "smartphone",
  cell: "smartphone",
  cellphone: "smartphone",
  trainers: "trainers",
  sneakers: "trainers",
  kicks: "trainers",
  hoover: "vacuum",
  alloys: "alloy wheels",
  rims: "alloy wheels",
  ps5: "playstation",
  ps4: "playstation",
  xbox: "xbox",
  mac: "macbook",
  pram: "pushchair",
  buggy: "pushchair",
  pushchair: "pushchair",
  stroller: "pushchair",
  drill: "drill",
  cordless: "cordless",
  impact: "impact driver",
  tyre: "tyres",
  tire: "tyres",
  ifone: "iphone",
  ipone: "iphone",
  samung: "samsung",
  addidas: "adidas",
  niké: "nike",
  playstaion: "playstation",
  macbok: "macbook",
  téléphone: "smartphone",
  telefon: "smartphone",
  móvil: "smartphone",
  movil: "smartphone",
  handy: "smartphone",
  chaussures: "trainers",
  zapatillas: "trainers",
  schuhe: "trainers",
  canapé: "sofa",
  canape: "sofa",
  sofa: "sofa",
  dyson: "dyson",
  bmw: "bmw",
  audi: "audi",
  mercedes: "mercedes",
  ford: "ford",
  vw: "volkswagen",
  volkswagen: "volkswagen",
};

export const KNOWN_BRANDS = new Set(
  [
    "apple",
    "samsung",
    "google",
    "huawei",
    "oneplus",
    "nike",
    "adidas",
    "puma",
    "reebok",
    "new balance",
    "converse",
    "vans",
    "bosch",
    "dewalt",
    "makita",
    "dyson",
    "bmw",
    "audi",
    "mercedes",
    "ford",
    "volkswagen",
    "toyota",
    "honda",
    "lego",
    "sony",
    "microsoft",
    "nintendo",
    "canon",
    "dji",
    "nikon",
    "gucci",
    "prada",
    "louis vuitton",
  ].map((brand) => brand.toLowerCase()),
);

/**
 * Catalog Master (Law XXX) renamed/merged many legacy title-engine leaves into
 * the 10 production roots. Title rules and tests still reference pre-Catalog
 * paths (phones, computers, shoes, car-parts, …). Map them to live slugs so
 * resolveTitleCategoryPath never silently returns null for known legacy paths.
 *
 * Key = legacy slug path joined by "/". Value = Catalog Master slug path.
 */
export const TITLE_CATEGORY_PATH_ALIASES: Record<string, readonly string[]> = {
  // Phones → Electronics > Phones & Tablets
  "phones/smartphones/unlocked-phones": ["electronics", "phones-tablets", "android-phones"],
  "phones/smartphones": ["electronics", "phones-tablets", "android-phones"],
  "electronics/phones-tablets/smartphones": ["electronics", "phones-tablets", "android-phones"],
  "phones/wearables/smartwatches": ["electronics", "wearables", "smartwatches"],

  // Computers → Electronics > Computers
  "computers/computer-accessories/mice": ["electronics", "computers", "mice"],
  "computers/computer-accessories/monitors": ["electronics", "computers", "monitors"],
  "computers/laptops/macbooks": ["electronics", "computers", "laptops"],
  "computers/laptops": ["electronics", "computers", "laptops"],

  // Gaming → Electronics > Gaming
  "gaming/consoles/playstation": ["electronics", "gaming", "consoles"],
  "gaming/consoles/xbox": ["electronics", "gaming", "consoles"],
  "gaming/consoles/nintendo": ["electronics", "gaming", "consoles"],
  "gaming/consoles": ["electronics", "gaming", "consoles"],

  // Shoes → Men's Fashion > Shoes (default for trainer brands)
  "shoes/trainers/nike": ["mens-fashion", "shoes", "trainers"],
  "shoes/trainers/adidas": ["mens-fashion", "shoes", "trainers"],
  "shoes/trainers": ["mens-fashion", "shoes", "trainers"],

  // Tools → Home & Garden > DIY & Tools
  "tools/power-tools/drills": ["home-garden", "diy-tools", "power-tools"],
  "tools/power-tools": ["home-garden", "diy-tools", "power-tools"],

  // Appliances → Home & Garden > Home Appliances
  "appliances/cleaning-appliances/vacuum-cleaners": ["home-garden", "appliances", "vacuum-cleaners"],
  "appliances/vacuum-cleaners": ["home-garden", "appliances", "vacuum-cleaners"],

  // Vehicle parts (car-parts root → vehicle-parts)
  "car-parts/body-parts/bumpers": ["vehicle-parts", "car-parts", "body-panels"],
  "car-parts/wheels-tyres/alloy-wheels": ["vehicle-parts", "tyres-and-wheels", "alloy-wheels"],
  "car-parts/wheels-tyres/tyres": ["vehicle-parts", "tyres-and-wheels", "car-tyres"],
  "car-parts/wheels-tyres": ["vehicle-parts", "tyres-and-wheels"],

  // Furniture leaf rename
  "home-garden/furniture/sofas": ["home-garden", "furniture", "sofas-and-armchairs"],

  // Electronics leaf renames
  "electronics/audio/earbuds": ["electronics", "tv-audio", "earbuds"],
  "electronics/cameras/mirrorless": ["electronics", "cameras", "digital-cameras"],
  "electronics/cameras/drones": ["collectibles", "hobby-electronics", "drones"],
  "electronics/tv-video/televisions": ["electronics", "tv-audio", "televisions"],

  // Toys → Kids & Baby
  "toys/building-toys/lego": ["kids-fashion", "toys-games", "building-sets"],
  "toys/building-toys": ["kids-fashion", "toys-games", "building-sets"],

  // Baby / pushchairs
  "baby/pushchairs/prams": ["kids-fashion", "baby", "pushchairs-and-travel"],
  "baby/pushchairs/travel-systems": ["kids-fashion", "baby", "pushchairs-and-travel"],
  "baby/baby-toys/soft-toys": ["kids-fashion", "toys-games", "soft-toys"],

  // Bags rename
  "womens-fashion/womens-bags/handbags": ["womens-fashion", "bags", "handbags"],

  // Books path (Books & Media > Books > Fiction)
  "books/fiction/crime": ["books", "books", "fiction"],

  // Office / cycling (nearest Catalog Master leaves)
  "office/office-furniture/office-chairs": ["home-garden", "furniture", "chairs"],
  "cycling/bikes/mountain-bikes": ["vehicle-parts", "bicycle-parts", "frames"],
  "cycling/bikes/road-bikes": ["vehicle-parts", "bicycle-parts", "frames"],
};

export function resolveTitleCategoryPath(slugs: [string, string, string?]): FlatCategoryPath | null {
  const cleaned = slugs.filter(Boolean) as string[];
  if (cleaned.length < 2) return null;

  const direct = resolveCategoryPathBySlugs(cleaned);
  if (direct) return direct;

  const aliasKey = cleaned.join("/");
  const aliased = TITLE_CATEGORY_PATH_ALIASES[aliasKey];
  if (aliased) {
    return resolveCategoryPathBySlugs([...aliased]);
  }

  // Prefix fallback: try progressively shorter alias keys (root/sub only).
  if (cleaned.length >= 3) {
    const prefixAlias = TITLE_CATEGORY_PATH_ALIASES[`${cleaned[0]}/${cleaned[1]}`];
    if (prefixAlias) {
      return resolveCategoryPathBySlugs([...prefixAlias]);
    }
  }

  return null;
}
