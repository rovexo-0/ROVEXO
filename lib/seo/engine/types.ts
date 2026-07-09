import type { EligibleListingsOptions } from "@/lib/listings/types";
import type { SearchIntent } from "@/lib/seo/engine/intent";

export type SeoPageKind =
  | "product"
  | "category"
  | "browse"
  | "brand"
  | "store"
  | "seller"
  | "location"
  | "location-category"
  | "discovery"
  | "collection"
  | "trend"
  | "static";

export type ProgrammaticFacet =
  | "category"
  | "location"
  | "brand"
  | "condition"
  | "price"
  | "seller-type"
  | "collection"
  | "season"
  | "deals";

/** Unified organic landing page — all programmatic, collection, trend and discovery pages. */
export type OrganicLandingPage = {
  kind: SeoPageKind;
  slug: string;
  path: string;
  title: string;
  description: string;
  search: EligibleListingsOptions;
  breadcrumbs: { name: string; href: string }[];
  facetTypes: ProgrammaticFacet[];
  intent?: SearchIntent;
  priority?: number;
  lastModified?: string;
  canonicalPath?: string;
};

export type DiscoveryPage = OrganicLandingPage & { kind: "discovery" };

/** Type guard — discovery routes only accept pages with kind "discovery". */
export function isDiscoveryPage(page: OrganicLandingPage): page is DiscoveryPage {
  return page.kind === "discovery";
}

export type BrandPage = {
  kind: "brand";
  slug: string;
  name: string;
  path: string;
  title: string;
  description: string;
};

export type LocationCategoryPage = {
  kind: "location-category";
  locationSlug: string;
  locationName: string;
  categorySlugs: string[];
  categoryName: string;
  path: string;
  title: string;
  description: string;
};

export type SeoRedirect = {
  sourcePath: string;
  targetPath: string;
  statusCode: number;
};

export { SEO_ENGINE_VERSION } from "@/lib/seo/engine/config";
