import { NextResponse } from "next/server";
import { getRecommendedBusinesses, getRecommendedListings } from "@/lib/launch/recommendations";

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? "listings";

  if (type === "businesses") {
    const businesses = await getRecommendedBusinesses();
    return NextResponse.json({ businesses });
  }

  const listings = await getRecommendedListings();
  return NextResponse.json({ listings });
}
