import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { buildMosControlCenterSnapshot } from "@/lib/marketplace-os/dashboard";
import { executeMosAutomation } from "@/lib/marketplace-os/reader";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await buildMosControlCenterSnapshot();
  return NextResponse.json({ snapshot });
}

export async function POST() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { snapshot, queue, result } = await executeMosAutomation();
  return NextResponse.json({ snapshot, queue, result });
}
