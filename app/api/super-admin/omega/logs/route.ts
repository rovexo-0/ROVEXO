import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getOmegaLiveDocument } from "@/lib/omega-command-center/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const live = await getOmegaLiveDocument();
  return NextResponse.json({
    logs: live.auditLog.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.administrator,
      timestamp: e.timestamp,
    })),
  });
}
