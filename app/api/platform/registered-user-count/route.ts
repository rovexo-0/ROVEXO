import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { readRegisteredUserCount } from "@/lib/platform/registered-user-count-v1";

export const dynamic = "force-dynamic";

/**
 * Public registered-user count — derived from public.profiles only.
 * One request = one head count. Homepage must not poll this route.
 */
export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "registered-user-count", 60, 60_000);
  if (limited) return limited;

  try {
    const result = await readRegisteredUserCount();
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "count_unavailable" },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      { ok: true, count: result.count },
      {
        status: 200,
        headers: {
          /* Short private cache only — not a substitute for realtime deltas. */
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "count_unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
