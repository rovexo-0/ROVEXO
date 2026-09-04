import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { listSellerReviewCases } from "@/lib/moderation/service";
import {
  rejectInvalidReviewCenterSurface,
  reviewCenterSurfaceFrom,
} from "@/lib/moderation/seller-review-center-access-v1";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const surfaceGate = await rejectInvalidReviewCenterSurface(
    auth.user.id,
    reviewCenterSurfaceFrom(request),
  );
  if (surfaceGate) return surfaceGate;

  try {
    const cases = await listSellerReviewCases(auth.user.id);
    return NextResponse.json({ cases });
  } catch {
    return NextResponse.json({ error: "Unable to load review cases." }, { status: 500 });
  }
}
