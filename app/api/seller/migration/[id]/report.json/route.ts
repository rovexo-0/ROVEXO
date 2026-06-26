import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { buildJsonReport } from "@/lib/seller/migration/publish/report-export";
import { getMigrationJobForSeller } from "@/lib/seller/migration/repository";
import { listMigrationItemsForJob } from "@/lib/seller/migration/repository-items";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const job = await getMigrationJobForSeller(auth.user.id, id);
  if (!job) {
    return NextResponse.json({ error: "Migration job not found." }, { status: 404 });
  }

  const items = await listMigrationItemsForJob(auth.user.id, id);
  const report = buildJsonReport(job, items);

  return NextResponse.json(report, {
    headers: {
      "Content-Disposition": `attachment; filename="migration-${id}.json"`,
    },
  });
}
