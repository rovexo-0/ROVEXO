import { resolveHomepageFeedItems } from "@/lib/homepage/feed-resolve";
import { getHomepageFeed } from "@/lib/products/catalog";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const result = await getHomepageFeed(page);
  // Real products only — filter/rank eligible DB inventory; never pad with demos.
  const resolved = page === 1 ? resolveHomepageFeedItems(result) : result;
  return NextResponse.json(resolved);
}
