import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicSellerPerformanceSummary } from "@/lib/seller-performance/service";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

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

  const summary = await getPublicSellerPerformanceSummary(userId, Boolean(profile?.verified));

  return NextResponse.json({
    userId: summary.userId,
    level: summary.level,
    levelLabel: summary.levelLabel,
    averageRating: summary.averageRating,
    reviewCount: summary.reviewCount,
    completedSales: summary.completedSales,
    verified: summary.verified,
    badges: summary.badges,
  });
}
