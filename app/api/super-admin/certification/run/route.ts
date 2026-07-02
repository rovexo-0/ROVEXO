import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runProductionCertification } from "@/lib/certification-center-engine/engine";
import { getCertificationCenterEngineSnapshot } from "@/lib/certification-center-engine/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const entry = await runProductionCertification(auth.user.id);
    const snapshot = await getCertificationCenterEngineSnapshot();
    return NextResponse.json({ ok: true, entry, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run certification.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
