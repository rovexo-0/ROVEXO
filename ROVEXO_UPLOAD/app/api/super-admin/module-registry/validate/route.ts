import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { validateRegistry } from "@/lib/enterprise-module-registry-v2/engine";
import { getModuleRegistryV2Snapshot } from "@/lib/enterprise-module-registry-v2/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const validation = await validateRegistry(auth.user.id);
    const snapshot = await getModuleRegistryV2Snapshot();
    return NextResponse.json({ ok: true, validation, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Validation failed" }, { status: 400 });
  }
}
