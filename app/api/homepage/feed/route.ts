import { resolveHomepageFeedItems } from "@/lib/homepage/feed-resolve";
import { getHomepageFeed } from "@/lib/products/catalog";
import { toPublicProductDocuments } from "@/lib/products/public-product-contract-v1";
import { listActivePreferredMarketplaceStores } from "@/lib/preferred-marketplace-stores/store";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const result = await getHomepageFeed(page);
  if (page !== 1) {
    return NextResponse.json({
      ...result,
      items: toPublicProductDocuments(result.items),
    });
  }

  const preferredStores = await listActivePreferredMarketplaceStores().catch(() => []);
  const resolved = resolveHomepageFeedItems(result, { preferredStores });
  return NextResponse.json({
    ...resolved,
    items: toPublicProductDocuments(resolved.items),
  });
}
