import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { markImportCancelled } from "@/lib/seller/migration/connectors/import-state";
import { MIGRATION_MAX_BATCHES_PER_RUN } from "@/lib/seller/migration/engine/config";
import {
  getMigrationJobForSeller,
} from "@/lib/seller/migration/repository";
import { updateMigrationJobEngine } from "@/lib/seller/migration/repository-engine";
import { runMigrationEngine } from "@/lib/seller/migration/service";

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

  return NextResponse.json({ job });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const existing = await getMigrationJobForSeller(auth.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Migration job not found." }, { status: 404 });
  }

  let body: { action?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.action === "start" || body.action === "process") {
    const job = await runMigrationEngine(auth.user.id, id, MIGRATION_MAX_BATCHES_PER_RUN);
    return NextResponse.json({ job });
  }

  if (body.action === "cancel") {
    markImportCancelled(id);
    const job = await updateMigrationJobEngine(auth.user.id, id, {
      status: "failed",
      errorMessage: "Import cancelled by user.",
    });
    return NextResponse.json({ job: job ?? existing });
  }

  return NextResponse.json({ job: existing });
}
