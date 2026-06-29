import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { exportRegistryDocument } from "@/lib/enterprise-module-registry-v2/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const document = await exportRegistryDocument();
  return NextResponse.json({ document });
}

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const document = await exportRegistryDocument();
  return NextResponse.json({ ok: true, document });
}
