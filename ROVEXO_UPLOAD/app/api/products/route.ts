import { getProductsBySection } from "@/lib/products/catalog";
import type { ProductSection } from "@/lib/products/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") as ProductSection | null;
  const page = Number(searchParams.get("page") ?? "1");

  if (!section || !["trending", "new", "recommended", "popular", "auctions"].includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const result = await getProductsBySection(section, page);
  return NextResponse.json(result);
}
