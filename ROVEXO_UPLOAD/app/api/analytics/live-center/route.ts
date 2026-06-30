import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { clearLiveAnalyticsCenterCache, getLiveAnalyticsCenterSnapshot } from "@/lib/analytics/live-center/service";
import { requireApiSuperAdmin } from "@/lib/auth/session";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(request, "live-center-read", 90, 60_000);
  if (limited) return limited;

  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (refresh) clearLiveAnalyticsCenterCache();

  try {
    const snapshot = await getLiveAnalyticsCenterSnapshot();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "Unable to load live analytics center." }, { status: 500 });
  }
}
