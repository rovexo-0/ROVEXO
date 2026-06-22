import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createSubscriptionCheckoutSession } from "@/lib/monetization/stripe";

const schema = z.object({
  planSlug: z.string().min(1),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "subscription-checkout", 8, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = schema.parse(await request.json());
    const result = await createSubscriptionCheckoutSession({
      userId: auth.user.id,
      userEmail: auth.user.email,
      planSlug: body.planSlug,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }
}
