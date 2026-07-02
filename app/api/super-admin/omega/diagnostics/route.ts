import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { computeOmegaHealth } from "@/lib/omega-command-center/health";
import { getOmegaSnapshot, validateOmegaReadiness } from "@/lib/omega-command-center/reader";
import { allEnginesPresent } from "@/lib/omega-command-center/engines";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const snapshot = await getOmegaSnapshot();
  return NextResponse.json({
    health: computeOmegaHealth(snapshot),
    readiness: validateOmegaReadiness(snapshot),
    enginesPresent: allEnginesPresent(),
    orchestration: "OMEGA is the single AI entry point",
  });
}
