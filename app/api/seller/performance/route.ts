import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getSellerPerformanceDashboard } from "@/lib/seller-performance/service";
import type { ScoreHistoryRange } from "@/lib/seller-performance/types";

function parseRange(value: string | null): ScoreHistoryRange {
  if (value === "30d" || value === "90d" || value === "1y" || value === "all") return value;
  return "90d";
}

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "seller-performance-dashboard", 60, 60_000);
  if (limited) return limited;

  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = parseRange(new URL(request.url).searchParams.get("range"));
  const data = await getSellerPerformanceDashboard(auth.user.id, range);
  return NextResponse.json(data);
}
