import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getSocSnapshot } from "@/lib/enterprise-security-operations-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const securityOperationsCenter = await getSocSnapshot();
  return NextResponse.json({ securityOperationsCenter });
}
