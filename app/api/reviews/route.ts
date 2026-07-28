import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { isValidRating } from "@/lib/rating/rating-engine-v1";
import {
  createOrderReview,
  getReviewEligibility,
  getSellerRatingSummary,
  listOrderReviews,
  listSellerReviews,
  replyToReview,
  updateOrderReview,
} from "@/lib/reviews/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  const orderId = searchParams.get("orderId");
  const list = searchParams.get("list");

  if (orderId) {
    const auth = await requireApiAuth();
    if (auth instanceof NextResponse) return auth;

    if (list === "order") {
      const items = await listOrderReviews(orderId, auth.user.id);
      if (items && typeof items === "object" && "error" in items) {
        return NextResponse.json({ error: items.error }, { status: 403 });
      }
      return NextResponse.json({ items, max: 2 });
    }

    const eligibility = await getReviewEligibility(orderId, auth.user.id);
    return NextResponse.json(eligibility);
  }

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId or orderId is required." }, { status: 400 });
  }

  const [reviews, summary] = await Promise.all([
    listSellerReviews(sellerId),
    getSellerRatingSummary(sellerId),
  ]);

  return NextResponse.json({
    reviews,
    averageRating: summary.averageRating,
    reviewCount: summary.reviewCount,
    distribution: summary.distribution,
  });
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
      action?: "create" | "edit" | "reply";
      reviewId?: string;
      replyText?: string;
    };

    const action = body.action ?? "create";

    if (action === "reply") {
      if (!body.reviewId || !body.replyText) {
        return NextResponse.json({ error: "Review and reply text are required." }, { status: 400 });
      }
      const result = await replyToReview(auth.user.id, {
        reviewId: body.reviewId,
        replyText: body.replyText,
      });
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, review: result.review });
    }

    if (action === "edit") {
      if (!body.reviewId) {
        return NextResponse.json({ error: "Review id is required." }, { status: 400 });
      }
      if (body.rating != null && !isValidRating(body.rating)) {
        return NextResponse.json(
          { error: "Rating must be a whole number between 1 and 5." },
          { status: 400 },
        );
      }
      const result = await updateOrderReview(auth.user.id, {
        reviewId: body.reviewId,
        rating: body.rating,
        comment: body.comment,
      });
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, review: result.review });
    }

    if (!body.orderId || body.rating == null) {
      return NextResponse.json({ error: "Order and rating are required." }, { status: 400 });
    }

    if (!isValidRating(body.rating)) {
      return NextResponse.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 },
      );
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
