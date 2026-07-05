import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getCommandCenterDashboardSnapshot } from "@/lib/super-admin/command-center/dashboard-snapshot";
import { getCommandCenterRegistry } from "@/lib/super-admin/command-center/registry";
import { getCommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1";
import { getDatabaseHealthSnapshot } from "@/lib/super-admin/database-health/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const [registry, database, dashboard, operationsCenter] = await Promise.all([
    Promise.resolve(getCommandCenterRegistry()),
    getDatabaseHealthSnapshot(),
    getCommandCenterDashboardSnapshot(),
    getCommandCenterV1Snapshot(),
  ]);

  return NextResponse.json({
    ok: true,
    registry,
    database,
    dashboard,
    operationsCenter,
  });
}