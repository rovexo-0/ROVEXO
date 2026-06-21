import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { listModerationAuditLogs, listModerationQueue } from "@/lib/moderation/service";

export async function GET(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const queueId = searchParams.get("queueId") ?? undefined;

  const [queue, auditLogs] = await Promise.all([
    listModerationQueue(100),
    listModerationAuditLogs(queueId ?? undefined, 100),
  ]);

  return NextResponse.json({ queue, auditLogs });
}
