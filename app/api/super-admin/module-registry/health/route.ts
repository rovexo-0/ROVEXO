import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getModuleRegistryV2Snapshot("health");
  return NextResponse.json({
    dashboard: snapshot.dashboard,
    modules: snapshot.modules.map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      health: m.health,
      lifecycle: m.lifecycle,
      healthEndpoint: m.healthEndpoint,
    })),
  });
}
