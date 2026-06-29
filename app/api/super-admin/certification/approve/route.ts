import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { approveCertificationStage } from "@/lib/certification-center-engine/engine";
import { getCertificationCenterEngineSnapshot } from "@/lib/certification-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  stage: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const approvals = await approveCertificationStage(body.stage as never, auth.user.id, body.notes);
    const snapshot = await getCertificationCenterEngineSnapshot();
    return NextResponse.json({ ok: true, approvals, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve stage.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
