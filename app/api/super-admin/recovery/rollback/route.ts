import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runRecoveryRollback } from "@/lib/recovery-center-engine/engine";
import { getRecoveryCenterEngineSnapshot } from "@/lib/recovery-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  targetId: z.string(),
  module: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const entry = await runRecoveryRollback(body, auth.user.id);
    const snapshot = await getRecoveryCenterEngineSnapshot();
    return NextResponse.json({ ok: true, entry, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run rollback.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
