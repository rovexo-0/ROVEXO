/**
 * ROVEXO Catalog Master — curated Brand databases per product-type vertical.
 * Absolute Law XXX: each Product Type uses its own curated brand list.
 * Always includes "No Brand".
 */

import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import { getAttrPresetForProductTypeSlug } from "@/lib/catalog/tree";

function withNoBrand(...brands: string[]): readonly string[] {
  const unique = new Set<string>([CATALOG_NO_BRAND, ...brands]);
  return [...unique];
}

const FASHION_BRANDS = withNoBrand(
  "Nike",
  "Adidas",
  "Zara",
  "H&M",
  "Next",
  "Primark",
  "Uniqlo",
  "Mango",
  "ASOS",
  "Levi's",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Ralph Lauren",
  "The North Face",
  "Gucci",
  "Louis Vuitton",
  "Chanel",
  "Other",
);

const SHOE_BRANDS = withNoBrand(
  "Nike",
  "Adidas",
  "Puma",
  "New Balance",
  "Converse",
  "Vans",
  "Clarks",
  "Dr. Martens",
  "Timberland",
  "Skechers",
  "UGG",
  "Birkenstock",
  "Crocs",
  "Jordan",
  "Other",
);

const ELECTRONICS_BRANDS = withNoBrand(
  "Apple",
  "Samsung",
  "Sony",
  "Google",
  "Huawei",
  "Xiaomi",
  "OnePlus",
  "Nokia",
  "Motorola",
  "LG",
  "HP",
  "Dell",
  "Lenovo",
  "ASUS",
  "Microsoft",
  "Canon",
  "Nikon",
  "Bose",
  "JBL",
  "Anker",
  "Other",
);

const HOME_BRANDS = withNoBrand(
  "IKEA",
  "Dunelm",
  "John Lewis",
  "Habitat",
  "Muji",
  "Dyson",
  "Philips",
  "Bosch",
  "Black+Decker",
  "Other",
);

const TOY_BRANDS = withNoBrand(
  "LEGO",
  "Hasbro",
  "Mattel",
  "Disney",
  "Nintendo",
  "Other",
);

const SPORTS_BRANDS = withNoBrand(
  "Nike",
  "Adidas",
  "Puma",
  "Under Armour",
  "Reebok",
  "Decathlon",
  "The North Face",
  "Patagonia",
  "Columbia",
  "Garmin",
  "Other",
);

const VEHICLE_PART_BRANDS = withNoBrand(
  "Bosch",
  "Brembo",
  "NGK",
  "Castrol",
  "Michelin",
  "Continental",
  "Goodyear",
  "Pirelli",
  "Denso",
  "Mann Filter",
  "Thule",
  "Halfords",
  "Other",
);

const BOOK_BRANDS = withNoBrand("Penguin", "HarperCollins", "Other");

const BEAUTY_BRANDS = withNoBrand(
  "The Ordinary",
  "CeraVe",
  "L'Oréal",
  "Maybelline",
  "Clinique",
  "Other",
);

const GENERIC_BRANDS = withNoBrand("Other");

const PRESET_BRANDS: Record<string, readonly string[]> = {
  fashion: FASHION_BRANDS,
  shoes: SHOE_BRANDS,
  kidsFashion: FASHION_BRANDS,
  phone: ELECTRONICS_BRANDS,
  laptop: ELECTRONICS_BRANDS,
  electronics: ELECTRONICS_BRANDS,
  pillow: HOME_BRANDS,
  homeSoft: HOME_BRANDS,
  homeHard: HOME_BRANDS,
  jewellery: FASHION_BRANDS,
  jewellerySized: FASHION_BRANDS,
  collectible: GENERIC_BRANDS,
  book: BOOK_BRANDS,
  toy: TOY_BRANDS,
  sports: SPORTS_BRANDS,
  vehicleParts: VEHICLE_PART_BRANDS,
  beauty: BEAUTY_BRANDS,
  generic: GENERIC_BRANDS,
};

/** Curated brands for a product-type slug. Always includes No Brand. */
export function getBrandsForProductType(productTypeSlug: string): readonly string[] {
  const preset = getAttrPresetForProductTypeSlug(productTypeSlug);
  return PRESET_BRANDS[preset] ?? GENERIC_BRANDS;
}

export function assertProductTypeBrandsIncludeNoBrand(
  brands: readonly string[],
): boolean {
  return brands.includes(CATALOG_NO_BRAND);
}
