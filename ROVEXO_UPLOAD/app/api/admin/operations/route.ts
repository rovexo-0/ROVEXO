import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getProductionOperationsSnapshot();
  return NextResponse.json(snapshot);
}
