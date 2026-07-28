import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getReputationPublicProfile } from "@/lib/reputation/store";
import { assertNoInternalScoreInPublicPayload } from "@/lib/reputation/public-contract";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

/**
 * Reputation Engine v1.0 — ONE public API.
 * Returns approved public fields only. Never internal/fraud/risk scores.
 */
export async function GET(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, "reputation-public", 120, 60_000);
  if (limited) return limited;

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "User id required." }, { status: 400 });
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
    averageRating: reputation.averageRating,
    totalReviews: reputation.totalReviews,
    completedOrders: reputation.completedOrders,
    verificationStatus: reputation.verificationStatus,
    publicBadges: reputation.publicBadges,
    levelLabel: reputation.levelLabel,
  };

  if (!assertNoInternalScoreInPublicPayload(payload)) {
    return NextResponse.json({ error: "Reputation payload blocked." }, { status: 500 });
  }

  return NextResponse.json(payload);
}
