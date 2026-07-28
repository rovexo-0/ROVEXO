import { NextResponse } from "next/server";
import { requireApiAuth, requireApiSuperAdmin } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import {
  FOLLOW_NOTIFICATIONS_ENGINE_V1,
  getFollowNotificationPrefs,
  getFollowNotificationQueueDepth,
  retryFollowNotificationQueue,
  updateFollowNotificationUserPrefs,
  type FollowNotificationPrefs,
} from "@/lib/follow-notifications";

/**
 * Follow Notifications Engine v1.0 — ONE API
 * Prefs + queue status. Delivery remains lib/notifications.
 */
export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    engine: FOLLOW_NOTIFICATIONS_ENGINE_V1.version,
    prefs: getFollowNotificationPrefs(auth.user.id),
    queueDepth: getFollowNotificationQueueDepth(),
    supportedEvents: FOLLOW_NOTIFICATIONS_ENGINE_V1.supportedEvents,
  });
}

export async function PATCH(request: Request) {
  const limited = await enforceRateLimit(request, "follow-notifications", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Partial<FollowNotificationPrefs>;
    const prefs = updateFollowNotificationUserPrefs(auth.user.id, {
      ...(typeof body.followActivity === "boolean" ? { followActivity: body.followActivity } : {}),
      ...(typeof body.newListings === "boolean" ? { newListings: body.newListings } : {}),
      ...(typeof body.priceReductions === "boolean"
        ? { priceReductions: body.priceReductions }
        : {}),
      ...(typeof body.badgeAwards === "boolean" ? { badgeAwards: body.badgeAwards } : {}),
      ...(typeof body.marketing === "boolean" ? { marketing: body.marketing } : {}),
    });
    return NextResponse.json({ success: true, prefs });
  } catch {
    return NextResponse.json({ error: "Unable to update preferences." }, { status: 500 });
  }
}

/** Queue retry is Super Admin only — process-local queue must not be drainable by any user. */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "follow-notifications-retry", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as { action?: string };
    if (body.action !== "retry_queue") {
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }
    const recovered = await retryFollowNotificationQueue();
    return NextResponse.json({
      success: true,
      recovered,
      queueDepth: getFollowNotificationQueueDepth(),
    });
  } catch {
    return NextResponse.json({ error: "Unable to retry queue." }, { status: 500 });
  }
}
