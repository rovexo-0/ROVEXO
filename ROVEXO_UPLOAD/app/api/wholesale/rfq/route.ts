import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { createRfqRequest } from "@/lib/wholesale/service";

const rfqSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  quantity: z.number().int().min(1).max(1000000),
  categorySlug: z.string().optional(),
  premium: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = rfqSchema.parse(await request.json());
    const rfq = await createRfqRequest({
      buyerId: auth.user.id,
      title: body.title,
      description: body.description,
      quantity: body.quantity,
      categorySlug: body.categorySlug,
      premium: body.premium,
    });
    if (!rfq) return NextResponse.json({ error: "Unable to create RFQ." }, { status: 500 });
    return NextResponse.json({ success: true, rfq });
  } catch {
    return NextResponse.json({ error: "Invalid RFQ request." }, { status: 400 });
  }
}
