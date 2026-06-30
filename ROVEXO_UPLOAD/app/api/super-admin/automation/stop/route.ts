import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeAutomationAction } from "@/lib/enterprise-automation-hub/actions";
import { getAutomationSnapshot } from "@/lib/enterprise-automation-hub/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  try {
    const result = await executeAutomationAction("stop", auth.user.id, { mfaVerified: true });
    const automationHub = await getAutomationSnapshot();
    return NextResponse.json({ ok: true, ...result, automationHub });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stop failed" }, { status: 400 });
  }
}
