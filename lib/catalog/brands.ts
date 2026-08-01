/**
 * ROVEXO Catalog Master — Brands.
 * Always includes "No Brand". Compact popular set — not an infinite marketplace dump.
 */

/** Required on every brand picker. */
export const CATALOG_NO_BRAND = "No Brand" as const;

export const CATALOG_POPULAR_BRANDS = [
  CATALOG_NO_BRAND,
  "Nike",
  "Adidas",
  "Apple",
  "Samsung",
  "Sony",
  "IKEA",
  "Zara",
  "H&M",
  "Next",
  "Primark",
  "Levi's",
  "The North Face",
  "Puma",
  "New Balance",
  "Converse",
  "Vans",
  "Gucci",
  "Louis Vuitton",
  "Chanel",
  "Rolex",
  "Casio",
  "HP",
  "Dell",
  "Lenovo",
  "Microsoft",
  "Google",
  "Amazon",
  "LEGO",
  "Hasbro",
  "Nintendo",
  "PlayStation",
  "Xbox",
  "Canon",
  "Nikon",
  "Bose",
  "JBL",
  "Dyson",
  "Bosch",
  "Philips",
  "Uniqlo",
  "Mango",
  "ASOS",
  "River Island",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Ralph Lauren",
  "Under Armour",
  "Reebok",
  "Timberland",
  "Dr. Martens",
] as const;

/** Extended brand names beyond the popular set. */
const CATALOG_EXTENDED_BRANDS = [
  "Acer",
  "Alienware",
  "Amazon Basics",
  "Anker",
  "ASUS",
  "Beats",
  "Belkin",
  "BenQ",
  "Birkenstock",
  "Black+Decker",
  "Boohoo",
  "Burton",
  "Cath Kidston",
  "Clarks",
  "Columbia",
  "Crocs",
  "Decathlon",
  "Disney",
  "Dunelm",
  "Fitbit",
  "Garmin",
  "GoPro",
  "Habitat",
  "Hollister",
  "Huawei",
  "Hugo Boss",
  "Jack & Jones",
  "JD Sports",
  "John Lewis",
  "Jordan",
  "Kodak",
  "Lacoste",
  "LG",
  "Logitech",
  "Makita",
  "DeWalt",
  "Dior",
  "Mamas & Papas",
  "Matalan",
  "Mattel",
  "Monsoon",
  "Motorola",
  "Muji",
  "Nokia",
  "OnePlus",
  "Panasonic",
  "Patagonia",
  "PrettyLittleThing",
  "Razer",
  "Skullcandy",
  "Skechers",
  "Superdry",
  "Ted Baker",
  "UGG",
  "Urban Outfitters",
  "Xiaomi",
  "Other",
] as const;

/** Full searchable brand pool (popular first, then extended — no duplicates). */
export const CATALOG_BRANDS = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...CATALOG_POPULAR_BRANDS, ...CATALOG_EXTENDED_BRANDS]) {
    const key = name.trim().toLowerCase().replace(/[^a-z0-9&]/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out as readonly string[];
})();

export const CATALOG_POPULAR_BRAND_IDS = CATALOG_POPULAR_BRANDS;
