import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { getSellerReviewCase } from "@/lib/moderation/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { id } = await context.params;
  const reviewCase = await getSellerReviewCase(auth.user.id, id);

  if (!reviewCase) {
    return NextResponse.json({ error: "Review case not found." }, { status: 404 });
  }

  return NextResponse.json({ case: reviewCase });
}
