import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getOmegaSnapshot } from "@/lib/omega-command-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const omega = await getOmegaSnapshot();
  return NextResponse.json({ omega });
}
