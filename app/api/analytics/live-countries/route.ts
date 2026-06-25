import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getLiveCountriesSnapshot } from "@/lib/analytics/live-countries/service";
import { requireApiAdmin } from "@/lib/auth/session";

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(request, "live-countries-read", 120, 60_000);
  if (limited) return limited;

  try {
    const snapshot = await getLiveCountriesSnapshot();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "Unable to load live countries." }, { status: 500 });
  }
}
