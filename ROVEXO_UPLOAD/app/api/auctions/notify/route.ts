import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  isSubscribedToAuctionLaunch,
  subscribeToAuctionLaunch,
} from "@/lib/auctions/notify-store";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const subscribed = await isSubscribedToAuctionLaunch(auth.user.id);
  return NextResponse.json({ subscribed });
}

export async function POST() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const saved = await subscribeToAuctionLaunch(auth.user.id);
  if (!saved) {
    return NextResponse.json({ error: "Unable to save notification request." }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true });
}
