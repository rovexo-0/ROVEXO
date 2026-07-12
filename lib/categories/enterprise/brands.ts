/**
 * Enterprise marketplace brand database — re-exports canonical SSOT from lib/brands.
 */

export {
  MARKETPLACE_BRANDS,
  MARKETPLACE_BRANDS_BY_VERTICAL,
  POPULAR_BRAND_IDS,
  VEHICLE_BRANDS,
  ELECTRONICS_BRANDS,
  FASHION_BRANDS,
  HOME_BRANDS,
  PILLOW_BRANDS,
  TOOL_BRANDS,
  SPORTS_BRANDS,
  BABY_BRANDS,
  BRAND_DATABASE,
  BRAND_COUNT,
  getBrandsForVertical,
  findBrandByName,
  validateBrand,
  type BrandRecord,
} from "@/lib/brands";
