/**
 * Canonical marketplace storage capacity database — SSOT for electronics and media.
 */

export const STORAGE_CAPACITIES = [
  "8GB",
  "16GB",
  "32GB",
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
  "2TB",
  "4TB",
  "8TB",
] as const;

export const RAM_CAPACITIES = [
  "2GB",
  "3GB",
  "4GB",
  "6GB",
  "8GB",
  "12GB",
  "16GB",
  "24GB",
  "32GB",
  "64GB",
  "128GB",
] as const;

export const MARKETPLACE_STORAGE_BY_SCOPE = {
  default: STORAGE_CAPACITIES,
  phones: STORAGE_CAPACITIES,
  computers: STORAGE_CAPACITIES,
  gaming: STORAGE_CAPACITIES,
  electronics: STORAGE_CAPACITIES,
} as const;
