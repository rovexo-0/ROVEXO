import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import {
  followUser,
  getFollowCounts,
  isFollowing,
  listFollowers,
  listFollowing,
  unfollowUser,
  updateFollowNotificationPrefs,
} from "@/lib/follow/marketplace-follow-store-v1";
import { isMarketplaceFollowAuthorized } from "@/lib/social/social-system-removal-v1";
import {
  processFollowNotificationEvent,
  resolveFollowNotificationActor,
  updateFollowNotificationUserPrefs,
} from "@/lib/follow-notifications";

export async function GET(request: Request) {
  if (!isMarketplaceFollowAuthorized()) {
    return NextResponse.json({ error: "Follow is unavailable." }, { status: 403 });
  }

  const limited = await enforceRateLimit(request, "follows-read", 120, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const list = searchParams.get("list"); // followers | following
  const check = searchParams.get("check"); // followingId to check
  const q = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const auth = await requireApiAuth();
  const viewerId = auth instanceof NextResponse ? null : auth.user.id;

  if (check) {
    if (!viewerId) {
      return NextResponse.json({ isFollowing: false });
    }
    const following = await isFollowing(viewerId, check === "me" ? userId : check);
    const counts = await getFollowCounts(userId);
    return NextResponse.json({ isFollowing: following, ...counts });
  }

  if (list === "followers") {
    const items = await listFollowers(userId, viewerId, { limit, offset, q });
    const counts = await getFollowCounts(userId);
    return NextResponse.json({ items, ...counts });
  }

  if (list === "following") {
    const items = await listFollowing(userId, viewerId, { limit, offset, q });
    const counts = await getFollowCounts(userId);
    return NextResponse.json({ items, ...counts });
  }

  const counts = await getFollowCounts(userId);
  let following = false;
  if (viewerId) {
    following = await isFollowing(viewerId, userId);
  }
  return NextResponse.json({ isFollowing: following, ...counts });
}

export async function POST(request: Request) {
  if (!isMarketplaceFollowAuthorized()) {
    return NextResponse.json({ error: "Follow is unavailable." }, { status: 403 });
  }

  const limited = await enforceRateLimit(request, "follows", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as {
      userId?: string;
      action?: "follow" | "unfollow";
      prefs?: {
        notifyNewListings?: boolean;
        notifyPriceDrops?: boolean;
        notifySoldItems?: boolean;
        notifyUserReturns?: boolean;
      };
    };

    if (!body.userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    if (body.prefs) {
      const result = await updateFollowNotificationPrefs(auth.user.id, body.userId, body.prefs);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      updateFollowNotificationUserPrefs(auth.user.id, {
        ...(typeof body.prefs.notifyNewListings === "boolean"
          ? { newListings: body.prefs.notifyNewListings }
          : {}),
        ...(typeof body.prefs.notifyPriceDrops === "boolean"
          ? { priceReductions: body.prefs.notifyPriceDrops }
          : {}),
      });
      return NextResponse.json({ success: true });
    }

    const action = body.action ?? "follow";
    if (action !== "follow" && action !== "unfollow") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    if (auth.user.id === body.userId) {
      return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
    }

    const result =
      action === "unfollow"
        ? await unfollowUser(auth.user.id, body.userId)
        : await followUser(auth.user.id, body.userId);

    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          code: "code" in result ? result.code ?? null : null,
        },
        { status: 400 },
      );
    }

    // Follow Notifications Engine — consume FollowCreated / FollowRemoved only.
    if (action === "follow") {
      void (async () => {
        const actor = await resolveFollowNotificationActor(auth.user.id);
        await processFollowNotificationEvent({
          type: "FollowCreated",
          actorId: auth.user.id,
          actorName: actor.name,
          actorUsername: actor.username,
          actorAvatarUrl: actor.avatarUrl,
          recipientId: body.userId!,
          occurredAt: new Date().toISOString(),
          dedupeKey: `follow-created:${auth.user.id}:${body.userId}`,
        });
      })();
    } else {
      void processFollowNotificationEvent({
        type: "FollowRemoved",
        actorId: auth.user.id,
        actorName: "Someone",
        recipientId: body.userId,
        occurredAt: new Date().toISOString(),
        dedupeKey: `follow-removed:${auth.user.id}:${body.userId}:${Date.now()}`,
      });
    }

    const [targetCounts, viewerCounts, stillFollowing] = await Promise.all([
      getFollowCounts(body.userId),
      getFollowCounts(auth.user.id),
      isFollowing(auth.user.id, body.userId),
    ]);

    return NextResponse.json({
      success: true,
      isFollowing: stillFollowing,
      // Target profile (User B) — Followers / Following on that profile
      followerCount: targetCounts.followerCount,
      followingCount: targetCounts.followingCount,
      // Viewer (User A) — Following total from user_follows SSOT
      viewerFollowingCount: viewerCounts.followingCount,
      viewerFollowerCount: viewerCounts.followerCount,
    });
  } catch {
    return NextResponse.json({ error: "Unable to update follow." }, { status: 500 });
  }
}
