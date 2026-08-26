import { NextResponse } from "next/server";
import { resolveListingDemand } from "@/lib/demand/demand-engine-resolve-v1";
import { getProductBySlug } from "@/lib/products/catalog";
import { toPublicListingDetailDocument } from "@/lib/products/public-listing-get-v1";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Public Listing GET — Native Listing Detail foundation.
 * Canonical source: getProductBySlug(). No seller auth. No Page View.
 * Demand: canonical resolver only (`eligible` boolean).
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

  const listing = toPublicListingDetailDocument(product);
  const demand = await resolveListingDemand({ productId: product.id });
  return NextResponse.json({
    listing: {
      ...listing,
      demand: { eligible: demand.state === "IN_DEMAND" },
    },
  });
}
