import { filtersToSearchOptions, parseSearchFilters } from "@/features/search/utils/filters";
import { searchListings } from "@/lib/listings/repository";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "search-results", 120, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const filters = parseSearchFilters(searchParams);
  const options = filtersToSearchOptions(filters, query, Number.isFinite(page) ? page : 1);

  const results = await searchListings(options);
  return NextResponse.json(results);
}
