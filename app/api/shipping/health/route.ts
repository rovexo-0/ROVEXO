import { NextResponse } from "next/server";

import { requireApiAuth } from "@/lib/auth/session";
import { getPrimaryShippingProvider } from "@/src/services/shipping";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const provider = getPrimaryShippingProvider();
  const health = await provider.healthCheck();

  return NextResponse.json({
    ok: health.status === "healthy",
    provider: health.provider,
    version: health.version,
    environment: health.environment,
    status: health.status,
    credentialsLoaded: health.credentialsLoaded,
    oauthOk: health.oauthOk,
    tokenObtained: health.tokenObtained,
    tokenValid: health.tokenValid,
    tokenExpiresAt: health.tokenExpiresAt,
    apiReachable: health.apiReachable,
    authUrl: health.authUrl,
    apiUrl: health.apiUrl,
    latencyMs: health.latencyMs,
    checks: health.checks,
    message: health.message,
  });
}
