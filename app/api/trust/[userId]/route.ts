import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { getPublicTrustSummary } from "@/lib/trust/service";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const limited = await enforceRateLimit(request, "trust-public", 120, 60_000);
  if (limited) return limited;

  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "User id required." }, { status: 400 });
  }

  const summary = await getPublicTrustSummary(userId);
  return NextResponse.json(summary);
}
