import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getGlobalUiIntegritySnapshot } from "@/lib/omega-global-ui-integrity-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const globalUiIntegrity = await getGlobalUiIntegritySnapshot("dashboard");
  return NextResponse.json({ globalUiIntegrity });
}
