import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeOmegaAction } from "@/lib/omega-command-center/actions";
import { getOmegaSnapshot } from "@/lib/omega-command-center/reader";

export const dynamic = "force-dynamic";

async function handle(action: "pause" | "resume" | "cancel") {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  try {
    const result = await executeOmegaAction(action, auth.user.id, { mfaVerified: true });
    const omega = await getOmegaSnapshot();
    return NextResponse.json({ ok: true, ...result, omega });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${action} failed` }, { status: 400 });
  }
}

export async function POST() {
  return handle("pause");
}
