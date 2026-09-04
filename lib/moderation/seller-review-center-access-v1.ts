import "server-only";

import { NextResponse } from "next/server";
import { loadBusinessStatus } from "@/lib/business/business-onboarding-v1";

/**
 * Unified accounts keep profiles.role = buyer. Review Center must not
 * require role=seller|business. Business surface is gated by Stripe +
 * active_seller_context on the server.
 */
export async function rejectInvalidReviewCenterSurface(
  userId: string,
  surface: string | null,
): Promise<NextResponse | null> {
  if (surface !== "business") return null;
  const status = await loadBusinessStatus(userId);
  if (!status.stripe.verified) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (status.activeSellerContext !== "business") {
    return NextResponse.json({ error: "Business context required." }, { status: 403 });
  }
  return null;
}

export function reviewCenterSurfaceFrom(request: Request): string | null {
  return new URL(request.url).searchParams.get("surface");
}
