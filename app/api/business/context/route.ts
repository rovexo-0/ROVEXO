import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { switchSellerContext } from "@/lib/business/business-onboarding-v1";
import { isSellerContext } from "@/lib/seller-context/seller-context-v1";

const bodySchema = z.object({
  context: z.enum(["individual", "business"]),
});

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success || !isSellerContext(parsed.data.context)) {
      return NextResponse.json({ error: "Invalid seller context." }, { status: 400 });
    }

    const result = await switchSellerContext(auth.user.id, parsed.data.context);
    return NextResponse.json({
      success: true,
      activeSellerContext: result.activeSellerContext,
      seller_context: result.activeSellerContext,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "BUSINESS_INFORMATION_REQUIRED") {
      return NextResponse.json(
        { error: "Business information is required.", nextStep: "information" },
        { status: 409 },
      );
    }
    if (name === "STRIPE_VERIFICATION_REQUIRED") {
      return NextResponse.json(
        { error: "Stripe verification is required.", nextStep: "stripe" },
        { status: 409 },
      );
    }
    if (name === "INVALID_SELLER_CONTEXT") {
      return NextResponse.json({ error: "Invalid seller context." }, { status: 400 });
    }
    if (name === "SELLER_CONTEXT_WRITE_FAILED") {
      return NextResponse.json({ error: "Seller context could not be saved." }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to switch seller context." }, { status: 500 });
  }
}
