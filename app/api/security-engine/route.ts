import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getPublicSecurityEngineConfig,
  getSecurityEngineAnalyticsForUser,
  getSecurityEngineContext,
} from "@/lib/security-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const [config, context, analytics] = await Promise.all([
    getPublicSecurityEngineConfig(),
    getSecurityEngineContext(auth.user.id),
    getSecurityEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, analytics });
}
