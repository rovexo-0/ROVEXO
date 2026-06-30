import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getTrustDashboardData } from "@/lib/trust/service";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "trust-dashboard", 60, 60_000);
  if (limited) return limited;
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getTrustDashboardData(auth.user.id, Boolean(auth.user.email_confirmed_at));
  return NextResponse.json(data);
}
