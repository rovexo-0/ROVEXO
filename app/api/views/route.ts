import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { recordProductView } from "@/lib/views/record-product-view";

const schema = z.object({
  productSlug: z.string().min(1).max(200),
});

/**
 * Product View Production Lock — ONLY entry for +1 view.
 * Must be called from /listing/[slug] after 1.5s visible dwell.
 * Homepage / Search / Saved / cards must NEVER call this.
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "product-view", 30, 60_000);
  if (limited) return limited;

  try {
    const body = schema.parse(await request.json());
    const result = await recordProductView(body.productSlug, {
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      counted: result.counted,
      views: result.views,
      reason: result.reason,
    });
  } catch {
    return NextResponse.json({ error: "Invalid view request." }, { status: 400 });
  }
}
