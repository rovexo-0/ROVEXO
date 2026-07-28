/**
 * ROVEXO Catalog Master — Size systems (compact, UK-first).
 */

export const CATALOG_CLOTHING_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "One size",
] as const;

export const CATALOG_UK_SHOE_SIZES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
] as const;

export const CATALOG_KIDS_CLOTHING_SIZES = [
  "0–3 m",
  "3–6 m",
  "6–12 m",
  "12–18 m",
  "18–24 m",
  "2–3 y",
  "3–4 y",
  "4–5 y",
  "5–6 y",
  "7–8 y",
  "9–10 y",
  "11–12 y",
  "13–14 y",
] as const;

export const CATALOG_RING_SIZES_UK = [
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

export const CATALOG_STORAGE_SIZES = [
  "16 GB",
  "32 GB",
  "64 GB",
  "128 GB",
  "256 GB",
  "512 GB",
  "1 TB",
  "2 TB",
] as const;

export const CATALOG_RAM_SIZES = [
  "4 GB",
  "8 GB",
  "16 GB",
  "32 GB",
  "64 GB",
] as const;

export const CATALOG_SIZES = {
  clothing: CATALOG_CLOTHING_SIZES,
  shoesUk: CATALOG_UK_SHOE_SIZES,
  kidsClothing: CATALOG_KIDS_CLOTHING_SIZES,
  ringsUk: CATALOG_RING_SIZES_UK,
  storage: CATALOG_STORAGE_SIZES,
  ram: CATALOG_RAM_SIZES,
} as const;
