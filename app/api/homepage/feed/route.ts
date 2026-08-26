import { resolveListingDemand } from "@/lib/demand/demand-engine-resolve-v1";
import { resolveHomepageFeedItems } from "@/lib/homepage/feed-resolve";
import { getHomepageFeed } from "@/lib/products/catalog";
import { toPublicProductDocuments } from "@/lib/products/public-product-contract-v1";
import { listActivePreferredMarketplaceStores } from "@/lib/preferred-marketplace-stores/store";
import { NextResponse } from "next/server";

async function attachCanonicalDemand<T extends { id: string }>(items: T[]) {
  return Promise.all(
    items.map(async (item) => {
      const demand = await resolveListingDemand({ productId: item.id });
      return { ...item, demand: { eligible: demand.state === "IN_DEMAND" } };
    }),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const result = await getHomepageFeed(page);
  if (page !== 1) {
    const items = toPublicProductDocuments(result.items);
    return NextResponse.json({
      ...result,
      items: await attachCanonicalDemand(items),
    });
  }

  const preferredStores = await listActivePreferredMarketplaceStores().catch(() => []);
  const resolved = resolveHomepageFeedItems(result, { preferredStores });
  const items = toPublicProductDocuments(resolved.items);
  return NextResponse.json({
    ...resolved,
    items: await attachCanonicalDemand(items),
  });
}
