import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getProductionOperationsSnapshot();
  return NextResponse.json(snapshot);
}
