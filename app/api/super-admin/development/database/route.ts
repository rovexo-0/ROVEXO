import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getDatabaseHealthSnapshot } from "@/lib/super-admin/database-health/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getDatabaseHealthSnapshot();
  const databaseTables = snapshot.tables.map((table) => ({
    id: `tbl-${table.name}`,
    name: table.name,
    rows: table.rowCount ?? 0,
    indexes: 0,
    relations: 0,
    accessible: table.accessible,
    source: "live" as const,
  }));

  return NextResponse.json({ ok: true, databaseTables, snapshot });
}
