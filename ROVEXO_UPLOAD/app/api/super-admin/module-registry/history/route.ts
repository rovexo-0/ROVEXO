import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getModuleRegistryV2Snapshot("history");
  return NextResponse.json({
    history: snapshot.history,
    versionMatrix: snapshot.versionMatrix,
    pendingPublish: snapshot.pendingPublish,
    pendingRollback: snapshot.pendingRollback,
  });
}
