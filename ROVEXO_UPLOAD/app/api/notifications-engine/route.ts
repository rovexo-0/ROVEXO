import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getNotificationsEngineAnalyticsForUser,
  getNotificationsEngineContext,
  getNotificationsEngineNotificationContext,
  getPublicNotificationsEngineConfig,
  listNotificationsEngineSummaries,
} from "@/lib/notifications-engine/reader";
import type { NotificationsEngineFilterId } from "@/lib/notifications-engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const notificationId = url.searchParams.get("notificationId");
  const filter = url.searchParams.get("filter") as NotificationsEngineFilterId | null;
  const query = url.searchParams.get("q") ?? undefined;

  if (notificationId) {
    const context = await getNotificationsEngineNotificationContext(notificationId, auth.user.id);
    if (!context) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, context, summaries, analytics] = await Promise.all([
    getPublicNotificationsEngineConfig(),
    getNotificationsEngineContext(auth.user.id),
    listNotificationsEngineSummaries(auth.user.id, { filter: filter ?? undefined, query }),
    getNotificationsEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, summaries, analytics });
}
