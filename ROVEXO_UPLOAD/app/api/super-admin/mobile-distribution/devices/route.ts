import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getDeviceLifecycleManagerSnapshot } from "@/lib/device-lifecycle-manager-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const deviceLifecycle = await getDeviceLifecycleManagerSnapshot();
  return NextResponse.json({ deviceLifecycle });
}
