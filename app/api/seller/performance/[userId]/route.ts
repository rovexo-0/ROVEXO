import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReputationPublicProfile } from "@/lib/reputation/store";
import { assertNoInternalScoreInPublicPayload } from "@/lib/reputation/public-contract";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

/**
 * LEGACY public path — permanently redirected to Reputation Engine.
 * Canonical: GET /api/reputation/[userId]
 * Badges come from Badge Engine via Reputation public profile (never seller-performance).
 */
export async function GET(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, "seller-performance-public", 120, 60_000);
  if (limited) return limited;

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "User id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("verified")
    .eq("id", userId)
    .maybeSingle();

  const reputation = await getReputationPublicProfile(userId, Boolean(profile?.verified));
  const payload = {
    userId: reputation.userId,
    // Legacy field aliases (backward compatible)
    level: reputation.levelLabel,
    levelLabel: reputation.levelLabel,
    averageRating: reputation.averageRating,
    reviewCount: reputation.totalReviews,
    completedSales: reputation.completedOrders,
    verified: reputation.verificationStatus === "verified",
    badges: reputation.publicBadges,
    // Canonical pointers
    canonicalApi: "/api/reputation/[userId]",
    deprecated: true,
  };

  if (!assertNoInternalScoreInPublicPayload(payload as Record<string, unknown>)) {
    return NextResponse.json({ error: "Reputation payload blocked." }, { status: 500 });
  }

  return NextResponse.json(payload, {
    headers: {
      Deprecation: "true",
      Link: `</api/reputation/${userId}>; rel="successor-version"`,
    },
  });
}
