import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getIntegrationsEngineAnalyticsForUser,
  getIntegrationsEngineContext,
  getPublicIntegrationsEngineConfig,
} from "@/lib/integrations-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const [config, context, analytics] = await Promise.all([
    getPublicIntegrationsEngineConfig(),
    getIntegrationsEngineContext(auth.user.id),
    getIntegrationsEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, analytics });
}
