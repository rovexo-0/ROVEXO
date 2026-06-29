import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { createRecoveryBackup } from "@/lib/recovery-center-engine/engine";
import { getRecoveryCenterEngineSnapshot } from "@/lib/recovery-center-engine/reader";
import { RECOVERY_BACKUP_TYPES } from "@/lib/recovery-center-engine/registry";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  type: z.enum(RECOVERY_BACKUP_TYPES),
  label: z.string().optional(),
  scheduled: z.boolean().optional(),
  encrypted: z.boolean().optional(),
  incremental: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const backup = await createRecoveryBackup(
      {
        type: body.type,
        label: body.label ?? `${body.type} backup`,
        scheduled: body.scheduled,
        encrypted: body.encrypted,
        incremental: body.incremental,
      },
      auth.user.id,
    );
    const snapshot = await getRecoveryCenterEngineSnapshot();
    return NextResponse.json({ ok: true, backup, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create backup.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
