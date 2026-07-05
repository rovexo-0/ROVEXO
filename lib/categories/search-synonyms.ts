/**
 * Marketplace category search synonyms — single source of truth for Sell picker,
 * title suggestions, filters and browse search aliases.
 *
 * Maps colloquial / UK / US terms onto tokens present in canonical category names.
 * Extend here; never with AI.
 */

import { EXTENDED_MARKETPLACE_SYNONYMS } from "@/lib/categories/enterprise/marketplace-synonyms";

const CORE_SEARCH_SYNONYMS: Record<string, string> = {
  // Home textiles
  cushion: "pillow",
  cushions: "pillow",
  bolster: "pillow",
  duvet: "duvet cover",
  comforter: "duvet",
  sheet: "bed sheets",
  sheets: "bed sheets",
  throw: "throws",
  blanket: "blankets",
  mat: "bath mats",
  mats: "bath mats",
  textile: "home textiles",
  textiles: "home textiles",
  fabric: "home textiles",
  linen: "home textiles",
  curtain: "curtains",

  // Furniture & home
  couch: "sofa",
  settee: "sofa",
  wardrobe: "wardrobes",
  sideboard: "cabinets",

  // Electronics & phones
  iph: "iphone mobile phones",
  ipho: "iphone",
  iphone: "apple iphone",
  iphones: "apple iphone",
  mobile: "smartphone",
  mobilephone: "smartphone",
  mobilephones: "smartphones",
  cellphone: "smartphone",
  cellphones: "smartphones",
  handset: "smartphone",
  telephone: "smartphone",
  smartwatch: "smartwatches",
  tablet: "tablets",
  telly: "television",
  tv: "television",
  earphones: "earbuds",
  headphone: "headphones",
  console: "consoles",
  laptop: "laptop",
  notebook: "laptop",
  monitor: "monitors",

  // Vehicles & parts
  bench: "bench seats",
  benches: "benches",
  weightbench: "weight benches",
  carseat: "bench seats",
  seatcover: "seat covers",
  floormat: "floor mats",
  bootliner: "boot liners",
  roofbox: "roof boxes",

  // Camping
  tent: "tents",
  tents: "family tents",
  awning: "awnings",
  sleepingbag: "sleeping bags",

  // Fashion & baby
  trainers: "trainers",
  sneakers: "trainers",
  jumper: "jumpers",
  nappy: "baby",
  nappies: "baby",
  pram: "pushchair",
  buggy: "pushchair",
  stroller: "pushchair",

  // Toys & books
  plush: "soft toy",
  teddy: "soft toy",
  cuddly: "soft toy",
  stuffed: "soft toy",
  novel: "fiction",
  paperback: "fiction",
  hardback: "fiction",

  // Appliances & DIY
  fridge: "fridge freezer",
  washer: "washing machine",
  hoover: "vacuum",
  pushbike: "bike",
  bicycle: "bike",
  tyre: "tyres",
  tire: "tyres",
  color: "colour",
  favorite: "favourite",
  organize: "organise",
  defense: "defence",
  theater: "theatre",
};

export const CATEGORY_SEARCH_SYNONYMS: Record<string, string> = {
  ...CORE_SEARCH_SYNONYMS,
  ...EXTENDED_MARKETPLACE_SYNONYMS,
};

/** Extra searchable labels for canonical segment slugs (not in the tree name). */
export const CATEGORY_SEGMENT_ALIASES: Record<string, string[]> = {
  "home-garden": ["home", "home and garden"],
  "home-textiles": ["home textiles", "textile", "textiles", "fabric", "linen"],
  curtains: ["curtains", "curtain", "blackout", "sheer", "thermal"],
  tables: ["table", "tables", "dining table", "coffee table"],
  phones: ["mobile phones", "mobile phone", "electronics"],
  smartphones: ["mobile phones", "mobile phone", "apple iphone"],
  electronics: ["electronics"],
  camping: ["camping", "outdoors", "tent", "tents"],
  tents: ["tents", "tent"],
  fitness: ["fitness", "gym"],
  "fitness-benches": ["weight benches", "weight bench", "gym bench"],
  furniture: ["furniture"],
  benches: ["benches", "bench"],
  "vehicle-interior": ["interior", "car interior", "bench seats", "bench"],
  "bench-seats": ["bench seats", "car seats", "bench"],
  "car-parts": ["vehicle parts", "auto parts"],
  "interior-parts": ["interior", "car interior"],
  blinds: ["blinds", "blind", "roman", "roller", "venetian"],
  "vehicle-exterior": ["exterior", "car exterior", "body kit"],
  "exterior-parts": ["exterior", "car exterior"],
  construction: ["construction", "building materials"],
  "womens-luxury": ["luxury", "designer"],
};

export function expandSearchSynonyms(token: string): string[] {
  const normalized = token.toLowerCase();
  const mapped = CATEGORY_SEARCH_SYNONYMS[normalized];
  if (!mapped) return [normalized];
  return mapped
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 2);
}
