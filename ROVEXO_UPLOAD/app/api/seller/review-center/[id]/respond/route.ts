import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { submitSellerReviewResponse } from "@/lib/moderation/service";

type RouteContext = { params: Promise<{ id: string }> };

const responseSchema = z.object({
  explanation: z.string().min(10).max(2000),
});

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const { id } = await context.params;
    const body = responseSchema.parse(await request.json());
    const reviewCase = await submitSellerReviewResponse({
      sellerId: auth.user.id,
      queueId: id,
      explanation: body.explanation,
    });

    if (!reviewCase) {
      return NextResponse.json({ error: "Review case not found." }, { status: 404 });
    }

    return NextResponse.json({ case: reviewCase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please provide an explanation (10–2000 characters)." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to submit response." }, { status: 500 });
  }
}
