import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getAssetManagerHistoryData } from "@/lib/asset-manager-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const history = await getAssetManagerHistoryData();
  return NextResponse.json(history);
}
