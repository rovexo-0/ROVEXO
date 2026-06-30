import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getAnalyticsEngineAnalyticsForUser,
  getAnalyticsEngineContext,
  getPublicAnalyticsEngineConfig,
} from "@/lib/analytics-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const [config, context, analytics] = await Promise.all([
    getPublicAnalyticsEngineConfig(),
    getAnalyticsEngineContext(auth.user.id),
    getAnalyticsEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, analytics });
}
