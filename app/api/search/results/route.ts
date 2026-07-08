import { filtersToSearchOptions, parseSearchFilters } from "@/features/search/utils/filters";
import { jsonWithCache } from "@/lib/api/cache-headers";
import { getEligibleListings } from "@/lib/listings/eligible-listings";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "search-results", 120, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const filters = parseSearchFilters(searchParams);
  const options = filtersToSearchOptions(filters, query, Number.isFinite(page) ? page : 1);

  const results = await getEligibleListings({ surface: "search", ...options });
  return jsonWithCache(results, "public-short");
}
