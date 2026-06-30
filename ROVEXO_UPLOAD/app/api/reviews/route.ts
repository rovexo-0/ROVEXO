import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createOrderReview, getReviewEligibility, listSellerReviews } from "@/lib/reviews/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  const orderId = searchParams.get("orderId");

  if (orderId) {
    const auth = await requireApiAuth();
    if (auth instanceof NextResponse) return auth;

    const eligibility = await getReviewEligibility(orderId, auth.user.id);
    return NextResponse.json(eligibility);
  }

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId or orderId is required." }, { status: 400 });
  }

  const reviews = await listSellerReviews(sellerId);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "reviews", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as {
      orderId?: string;
      rating?: number;
      comment?: string;
    };

    if (!body.orderId || !body.rating) {
      return NextResponse.json({ error: "Order and rating are required." }, { status: 400 });
    }

    const result = await createOrderReview(auth.user.id, {
      orderId: body.orderId,
      rating: body.rating,
      comment: body.comment,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, review: result.review });
  } catch {
    return NextResponse.json({ error: "Unable to submit review." }, { status: 500 });
  }
}
