import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { getSellerReviewCase } from "@/lib/moderation/service";
import {
  rejectInvalidReviewCenterSurface,
  reviewCenterSurfaceFrom,
} from "@/lib/moderation/seller-review-center-access-v1";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const surfaceGate = await rejectInvalidReviewCenterSurface(
    auth.user.id,
    reviewCenterSurfaceFrom(request),
  );
  if (surfaceGate) return surfaceGate;

  const { id } = await context.params;
  try {
    const reviewCase = await getSellerReviewCase(auth.user.id, id);
    if (!reviewCase) {
      return NextResponse.json({ error: "Review case not found." }, { status: 404 });
    }
    return NextResponse.json({ case: reviewCase });
  } catch {
    return NextResponse.json({ error: "Unable to load review case." }, { status: 500 });
  }
}
