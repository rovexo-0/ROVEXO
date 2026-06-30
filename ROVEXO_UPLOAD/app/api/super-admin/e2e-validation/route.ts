import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getE2eValidationSnapshot } from "@/lib/enterprise-e2e-validation-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const e2eValidation = await getE2eValidationSnapshot();
  return NextResponse.json({ e2eValidation });
}
