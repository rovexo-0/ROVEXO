import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { listModerationAuditLogs, listModerationQueue } from "@/lib/moderation/service";

export async function GET(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimitForUser(auth.user.id, "admin-moderation", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const queueId = searchParams.get("queueId") ?? undefined;

  const [queue, auditLogs] = await Promise.all([
    listModerationQueue(100),
    listModerationAuditLogs(queueId ?? undefined, 100),
  ]);

  return NextResponse.json({ queue, auditLogs });
}
