import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { BADGE_CATALOG, type BadgeId } from "@/lib/badge/badge-engine-v1";
import { applyBadgeEmergencyOverride, type BadgeOverrideAction } from "@/lib/badge/store";
import {
  processFollowNotificationEvent,
  resolveFollowNotificationActor,
} from "@/lib/follow-notifications";

/** Super Admin emergency override ONLY — immutable audit required. */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "badges-admin", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as {
      userId?: string;
      badgeId?: string;
      action?: BadgeOverrideAction;
      reason?: string;
    };

    if (!body.userId || !body.badgeId || !body.action || !body.reason) {
      return NextResponse.json(
        { error: "userId, badgeId, action, and reason are required." },
        { status: 400 },
      );
    }

    if (!(body.badgeId in BADGE_CATALOG)) {
      return NextResponse.json({ error: "Unknown badge." }, { status: 400 });
    }

    if (body.action !== "force_disable" && body.action !== "force_enable") {
      return NextResponse.json({ error: "Invalid override action." }, { status: 400 });
    }

    const result = await applyBadgeEmergencyOverride({
      userId: body.userId,
      badgeId: body.badgeId as BadgeId,
      action: body.action,
      reason: body.reason,
      actorId: auth.user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Follow Notifications consumes certified badge award (enable only) — no Badge Engine edits.
    if (body.action === "force_enable") {
      void (async () => {
        const actor = await resolveFollowNotificationActor(body.userId!);
        const label = BADGE_CATALOG[body.badgeId as BadgeId]?.label ?? "new";
        await processFollowNotificationEvent({
          type: "SellerBadgeAwarded",
          actorId: body.userId!,
          actorName: actor.name,
          actorUsername: actor.username,
          actorAvatarUrl: actor.avatarUrl,
          sellerId: body.userId!,
          badgeId: body.badgeId!,
          badgeLabel: label,
          occurredAt: new Date().toISOString(),
          dedupeKey: `seller-badge:${body.userId}:${body.badgeId}`,
        });
      })();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to apply badge override." }, { status: 500 });
  }
}
