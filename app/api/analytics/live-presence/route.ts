import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import {
  getRequestCity,
  getRequestCountryCode,
  recordVisitorPresence,
} from "@/lib/analytics/live-countries/platform";
import {
  inferTrafficSource,
  parseUserAgent,
  sanitizeClientText,
} from "@/lib/analytics/live-center/user-agent";

const bodySchema = z.object({
  sessionId: z.string().trim().min(8).max(128),
  referrer: z.string().trim().max(512).optional(),
  userAgent: z.string().trim().max(512).optional(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "live-presence", 30, 60_000);
  if (limited) return limited;

  try {
    const body = bodySchema.parse(await request.json());
    const countryCode = getRequestCountryCode(request);

    if (!countryCode) {
      return NextResponse.json({ success: true, recorded: false });
    }

    const parsed = parseUserAgent(body.userAgent ?? request.headers.get("user-agent"));
    const trafficSource = inferTrafficSource(
      sanitizeClientText(body.referrer) ?? request.headers.get("referer"),
    );

    await recordVisitorPresence(body.sessionId, countryCode, {
      city: getRequestCity(request),
      deviceCategory: parsed.deviceCategory,
      browser: parsed.browser,
      operatingSystem: parsed.operatingSystem,
      trafficSource,
    });
    return NextResponse.json({ success: true, recorded: true });
  } catch {
    return NextResponse.json({ error: "Invalid presence payload." }, { status: 400 });
  }
}
