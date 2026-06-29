import { searchAll } from "@/features/search/utils/search-server";
import { jsonWithCache } from "@/lib/api/cache-headers";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "search", 120, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "8");
  const location = searchParams.get("location") ?? undefined;

  const results = await searchAll(query, {
    productOffset: Number.isFinite(offset) ? offset : 0,
    productLimit: Number.isFinite(limit) ? limit : 8,
    locationCity: location,
  });

  return jsonWithCache(results, "public-short");
}
