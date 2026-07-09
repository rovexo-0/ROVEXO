import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { fetchCheckoutCarrierQuotes } from "@/lib/checkout/shipping-quotes.server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productSlug: z.string().trim().min(1),
  recipientName: z.string().trim().min(1),
  addressLine: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  country: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid shipping quote request." }, { status: 400 });
  }

  const result = await fetchCheckoutCarrierQuotes(parsed.data);

  return NextResponse.json({
    live: result.live,
    options: result.options,
    reason: result.reason ?? null,
  });
}
