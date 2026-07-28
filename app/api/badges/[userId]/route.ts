import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getPublicBadges } from "@/lib/badge/store";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

/** Badge Engine v1.0 — ONE public API. Approved badges only. No side-effect fan-out. */
export async function GET(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, "badges-public", 120, 60_000);
  if (limited) return limited;

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "User id required." }, { status: 400 });
  }

  const badges = await getPublicBadges(userId);

  return NextResponse.json({
    userId,
    badges,
  });
}
