import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { isMarketplaceFollowAuthorized } from "@/lib/social/social-system-removal-v1";
import {
  FOLLOWING_FEED_ENGINE_V1,
  getFollowingFeedPage,
  getFollowingFeedPrefs,
  updateFollowingFeedPrefs,
  type FollowingFeedPrefs,
} from "@/lib/following-feed";

/**
 * Homepage Following Feed Engine v1.0 — ONE API
 * Authenticated · Follow Engine consumers only · fail-safe payload.
 */
export async function GET(request: Request) {
  if (!isMarketplaceFollowAuthorized()) {
    return NextResponse.json({ error: "Following Feed is unavailable." }, { status: 403 });
  }

  const limited = await enforceRateLimit(request, "following-feed", 60, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const feed = await getFollowingFeedPage(auth.user.id, page);

  return NextResponse.json({
    engine: FOLLOWING_FEED_ENGINE_V1.version,
    ...feed,
  });
}

export async function PATCH(request: Request) {
  if (!isMarketplaceFollowAuthorized()) {
    return NextResponse.json({ error: "Following Feed is unavailable." }, { status: 403 });
  }

  const limited = await enforceRateLimit(request, "following-feed-prefs", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Partial<FollowingFeedPrefs>;
    const prefs = updateFollowingFeedPrefs(auth.user.id, {
      ...(typeof body.newListings === "boolean" ? { newListings: body.newListings } : {}),
      ...(typeof body.priceDrops === "boolean" ? { priceDrops: body.priceDrops } : {}),
      ...(typeof body.relistedItems === "boolean" ? { relistedItems: body.relistedItems } : {}),
      ...(typeof body.verifiedSellerEvents === "boolean"
        ? { verifiedSellerEvents: body.verifiedSellerEvents }
        : {}),
      ...(typeof body.badgeEvents === "boolean" ? { badgeEvents: body.badgeEvents } : {}),
    });
    return NextResponse.json({ success: true, prefs });
  } catch {
    return NextResponse.json({ error: "Unable to update preferences." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isMarketplaceFollowAuthorized()) {
    return NextResponse.json({ error: "Following Feed is unavailable." }, { status: 403 });
  }

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as { action?: string };
    if (body.action !== "prefs") {
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      prefs: getFollowingFeedPrefs(auth.user.id),
    });
  } catch {
    return NextResponse.json({ error: "Unable to read preferences." }, { status: 500 });
  }
}
