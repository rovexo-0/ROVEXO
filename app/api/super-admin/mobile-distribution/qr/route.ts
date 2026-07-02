import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { readLiveMobileDistributionCenterEngineDocument } from "@/lib/mobile-distribution-center-engine/engine";
import { getMobileDistributionCenterEngineSnapshot } from "@/lib/mobile-distribution-center-engine/reader";
import { buildQrInstallPayload } from "@/lib/mobile-distribution-center-engine/timeline";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const live = await readLiveMobileDistributionCenterEngineDocument();
  const qrInstall = buildQrInstallPayload({ config: live });
  const snapshot = await getMobileDistributionCenterEngineSnapshot();

  return NextResponse.json({ ok: true, qrInstall, snapshot: { ...snapshot, qrInstall } });
}
