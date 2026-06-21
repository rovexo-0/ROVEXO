import { enforceRateLimit } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const reportSchema = z.object({
  productSlug: z.string().min(1),
  reason: z.string().min(1),
  message: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "listing-report", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = reportSchema.parse(await request.json());
    const supabase = await createClient();

    const { data: product } = await supabase
      .from("products")
      .select("id, title")
      .eq("slug", body.productSlug)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    await createNotification({
      userId: auth.user.id,
      type: "system",
      title: "Listing report received",
      subtitle: `We received your report for “${product.title}”.`,
      href: `/listing/${body.productSlug}`,
      detail: [body.reason, body.message].filter(Boolean).join(" — "),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to submit report." }, { status: 500 });
  }
}
