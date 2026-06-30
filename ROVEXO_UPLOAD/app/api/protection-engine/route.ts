import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getProtectionEngineAnalyticsForUser,
  getProtectionEngineCaseContext,
  getProtectionEngineContext,
  getPublicProtectionEngineConfig,
  listProtectionEngineSummaries,
} from "@/lib/protection-engine/reader";
import type { ProtectionEngineFilterId } from "@/lib/protection-engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");
  const filter = url.searchParams.get("filter") as ProtectionEngineFilterId | null;
  const query = url.searchParams.get("q") ?? undefined;

  if (caseId) {
    const context = await getProtectionEngineCaseContext(caseId);
    if (!context) return NextResponse.json({ error: "Case not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, context, summaries, analytics] = await Promise.all([
    getPublicProtectionEngineConfig(),
    getProtectionEngineContext(auth.user.id),
    listProtectionEngineSummaries(auth.user.id, { filter: filter ?? undefined, query }),
    getProtectionEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, summaries, analytics });
}
