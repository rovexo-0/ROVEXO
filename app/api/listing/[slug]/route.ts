import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products/catalog";
import { toPublicListingDetailDocument } from "@/lib/products/public-listing-get-v1";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Public Listing GET — Native Listing Detail foundation.
 * Canonical source: getProductBySlug(). No seller auth. No Page View.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug?.trim() ?? "";

  if (!slug) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing: toPublicListingDetailDocument(product) });
}
