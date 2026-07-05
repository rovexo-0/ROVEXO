import { NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/seller/marketplace/oauth/service";
import { isOAuthPlatform } from "@/lib/seller/marketplace/oauth/types";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { platform } = await context.params;
  if (!isOAuthPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported OAuth platform." }, { status: 400 });
  }

  const url = new URL(request.url);
  const { redirectUrl, setCookie } = await handleOAuthCallback({
    platform,
    code: url.searchParams.get("code"),
    stateValue: url.searchParams.get("state"),
    cookieHeader: request.headers.get("cookie"),
    error: url.searchParams.get("error"),
  });

  const response = NextResponse.redirect(new URL(redirectUrl, url.origin));
  response.headers.set("Set-Cookie", setCookie);
  return response;
}
