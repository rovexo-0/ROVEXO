import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { resolveBusinessConnectAppBase } from "@/lib/business/business-connect-runtime-origin-v1";
import {
  startBusinessStripeConnect,
  type BusinessConnectSurface,
} from "@/lib/business/business-onboarding-v1";
import { getAppBaseUrl } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  let surface: BusinessConnectSurface = "native";
  let runtimeOrigin: string | undefined;
  try {
    const body = (await request.json()) as { surface?: unknown; runtimeOrigin?: unknown };
    if (body?.surface === "pwa") surface = "pwa";
    if (typeof body?.runtimeOrigin === "string") runtimeOrigin = body.runtimeOrigin;
  } catch {
    surface = "native";
  }

  const appBase = resolveBusinessConnectAppBase({
    originHeader: request.headers.get("origin"),
    refererHeader: request.headers.get("referer"),
    runtimeOrigin,
    fallbackBase: await getAppBaseUrl(),
  });

  try {
    const result = await startBusinessStripeConnect(auth.user.id, { surface, appBase });
    return NextResponse.json({ success: true, url: result.url, context: "business", surface });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "BUSINESS_INFORMATION_REQUIRED") {
      return NextResponse.json(
        { error: "Business information is required.", nextStep: "information" },
        { status: 409 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Unable to start Stripe Connect onboarding.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
