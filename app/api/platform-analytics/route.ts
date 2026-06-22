import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { recordPlatformAnalyticsEvent } from "@/lib/platform-analytics/events";
import { getPlatformAnalyticsSnapshot } from "@/lib/platform-analytics/service";

const eventSchema = z.object({
  domain: z.enum(["orders", "promotions", "trust", "wholesale", "monetization", "search", "help", "ai"]),
  metric: z.string().min(1).max(120),
  value: z.number().optional(),
  dimensions: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getPlatformAnalyticsSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "platform-analytics", 60, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = eventSchema.parse(await request.json());
    await recordPlatformAnalyticsEvent({
      ...body,
      dimensions: { ...body.dimensions, userId: auth.user.id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }
}
