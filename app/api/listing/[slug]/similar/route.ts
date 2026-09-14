import { NextResponse } from "next/server";
import { getSimilarProducts } from "@/lib/products/catalog";
import { toPublicProductDocuments } from "@/lib/products/public-product-contract-v1";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Public Similar Items — same eligibility as Homepage/Search.
 * Canonical source: getSimilarProducts() → getEligibleListings(surface: "similar").
 * Empty result stays empty. No seller auth. Public catalogue only.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug?.trim() ?? "";

  if (!slug) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const items = toPublicProductDocuments(await getSimilarProducts(slug, 8));
  return NextResponse.json({
    page: 1,
    hasMore: false,
    source: "getSimilarProducts",
    items,
  });
}
