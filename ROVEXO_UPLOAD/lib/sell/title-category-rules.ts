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
    patterns: ["smartphone", "mobile phone", "android phone"],
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
    patterns: ["power drill", "cordless drill", "electric drill", "combi drill"],
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
    patterns: ["trainers", "sneakers", "running shoes"],
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
    patterns: ["alloy wheels", "alloys", "alloy rim"],
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
    patterns: ["macbook", "mac book"],
    path: ["computers", "laptops", "macbooks"],
    confidence: 0.97,
    brands: ["apple"],
  },
  {
    patterns: ["laptop", "notebook", "chromebook"],
    path: ["computers", "laptops", "macbooks"],
    confidence: 0.92,
  },
  {
    patterns: ["playstation", "ps5", "ps4"],
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
    patterns: ["lego", "duplo"],
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
    patterns: ["handbag", "tote bag", "designer bag"],
    path: ["womens-fashion", "womens-bags", "handbags"],
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

export function resolveTitleCategoryPath(slugs: [string, string, string?]): FlatCategoryPath | null {
  return resolveCategoryPathBySlugs(slugs.filter(Boolean) as string[]);
}
