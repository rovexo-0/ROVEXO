import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { followSeller, isFollowingSeller, listFollowedSellerIds, unfollowSeller } from "@/lib/launch/follow-sellers";

const schema = z.object({
  sellerId: z.string().uuid(),
});

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const sellerId = new URL(request.url).searchParams.get("sellerId");
  if (sellerId) {
    const following = await isFollowingSeller(auth.user.id, sellerId);
    return NextResponse.json({ following });
  }

  const sellerIds = await listFollowedSellerIds(auth.user.id);
  return NextResponse.json({ sellerIds });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = schema.parse(await request.json());
    const success = await followSeller(auth.user.id, body.sellerId);
    if (!success) return NextResponse.json({ error: "Unable to follow seller." }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid follow request." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const sellerId = new URL(request.url).searchParams.get("sellerId");
  if (!sellerId) return NextResponse.json({ error: "Missing seller id." }, { status: 400 });

  const success = await unfollowSeller(auth.user.id, sellerId);
  if (!success) return NextResponse.json({ error: "Unable to unfollow seller." }, { status: 400 });
  return NextResponse.json({ success: true });
}
