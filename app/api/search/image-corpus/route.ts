import { resolveHomepageFeedItems } from "@/lib/homepage/feed-resolve";
import { getHomepageFeed } from "@/lib/products/catalog";
import { NextResponse } from "next/server";
import type { Product } from "@/lib/products/types";

/**
 * Camera Search Performance Freeze — ONE API CALL for image matching corpus.
 * Server gathers pages in parallel; client must not paginate sequentially.
 */
export async function GET() {
  const pageNumbers = [1, 2, 3, 4] as const;

  const pages = await Promise.all(pageNumbers.map((page) => getHomepageFeed(page)));

  const seen = new Set<string>();
  const items: Product[] = [];

  for (let index = 0; index < pages.length; index += 1) {
    const page = index === 0 ? resolveHomepageFeedItems(pages[index]!) : pages[index]!;
    for (const product of page.items) {
      if (!product.imageUrl || seen.has(product.id)) continue;
      seen.add(product.id);
      items.push(product);
    }
  }

  return NextResponse.json(
    { items, total: items.length, page: 1, hasMore: false },
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  );
}
