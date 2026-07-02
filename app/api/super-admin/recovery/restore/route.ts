import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runRecoveryRestore } from "@/lib/recovery-center-engine/engine";
import { getRecoveryCenterEngineSnapshot } from "@/lib/recovery-center-engine/reader";
import { RECOVERY_RESTORE_TYPES } from "@/lib/recovery-center-engine/registry";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  restoreType: z.enum(RECOVERY_RESTORE_TYPES),
  backupId: z.string().optional(),
  module: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const entry = await runRecoveryRestore(body, auth.user.id);
    const snapshot = await getRecoveryCenterEngineSnapshot();
    return NextResponse.json({ ok: true, entry, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run restore.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
