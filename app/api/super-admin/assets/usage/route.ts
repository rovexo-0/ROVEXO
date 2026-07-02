import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getAssetManagerUsageMap } from "@/lib/asset-manager-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const usage = await getAssetManagerUsageMap();
  return NextResponse.json(usage);
}
