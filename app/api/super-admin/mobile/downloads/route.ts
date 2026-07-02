import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getMobileCcSnapshot } from "@/lib/enterprise-mobile-control-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const mobileControlCenter = await getMobileCcSnapshot("downloads");
  return NextResponse.json({ mobileControlCenter, downloads: mobileControlCenter.downloads });
}
