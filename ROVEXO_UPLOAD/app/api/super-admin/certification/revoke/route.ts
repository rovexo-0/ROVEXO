import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { revokeCertification } from "@/lib/certification-center-engine/engine";
import { getCertificationCenterEngineSnapshot } from "@/lib/certification-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ reason: z.string().optional() });

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const entry = await revokeCertification(auth.user.id, body.reason);
    const snapshot = await getCertificationCenterEngineSnapshot();
    return NextResponse.json({ ok: true, entry, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke certification.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
