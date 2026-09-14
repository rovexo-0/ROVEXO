import { NextResponse } from "next/server";
import { getMemberProducts } from "@/lib/products/catalog";
import { toPublicProductDocuments } from "@/lib/products/public-product-contract-v1";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Public Member Items — other eligible listings from the same seller.
 * Canonical source: getMemberProducts() → getEligibleListings(surface: "seller").
 * Empty result stays empty. No seller auth. Public catalogue only.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug?.trim() ?? "";

  if (!slug) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const items = toPublicProductDocuments(await getMemberProducts(slug, 8));
  return NextResponse.json({
    page: 1,
    hasMore: false,
    source: "getMemberProducts",
    items,
  });
}
