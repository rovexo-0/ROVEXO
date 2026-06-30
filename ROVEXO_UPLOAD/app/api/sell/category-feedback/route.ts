import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPlatformAnalyticsEvent } from "@/lib/platform-analytics/events";

const feedbackSchema = z.object({
  titleHash: z.string().min(4).max(32),
  predictedPathId: z.string().min(1),
  finalPathId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  tier: z.enum(["auto", "suggest", "none", "recommend", "options"]),
  language: z.string().min(2).max(12).optional(),
  country: z.string().min(2).max(8).optional(),
});

export async function POST(request: Request) {
  try {
    const body = feedbackSchema.parse(await request.json());
    const tier =
      body.tier === "recommend" || body.tier === "options" ? "suggest" : body.tier;

    await recordPlatformAnalyticsEvent({
      domain: "ai",
      metric: "category_correction",
      value: 1,
      dimensions: {
        titleHash: body.titleHash,
        predictedPathId: body.predictedPathId,
        finalPathId: body.finalPathId,
        confidence: body.confidence,
        tier,
        language: body.language ?? "en",
        country: body.country ?? "GB",
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
