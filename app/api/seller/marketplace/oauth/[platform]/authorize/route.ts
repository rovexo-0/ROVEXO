import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { buildOAuthAuthorizeResponse } from "@/lib/seller/marketplace/oauth/service";
import { isOAuthPlatform, type OAuthPlatformId } from "@/lib/seller/marketplace/oauth/types";
import { isOAuthPlatformConfigured } from "@/lib/seller/marketplace/oauth/env";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const { platform } = await context.params;
  if (!isOAuthPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported OAuth platform." }, { status: 400 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");
  const shop = url.searchParams.get("shop");

  if (!isOAuthPlatformConfigured(platform as OAuthPlatformId)) {
    const safeReturn = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/import";
    return NextResponse.redirect(new URL(`${safeReturn}?oauth=unconfigured`, url.origin));
  }

  const { redirectUrl, setCookie } = buildOAuthAuthorizeResponse({
    platform: platform as OAuthPlatformId,
    sellerId: auth.user.id,
    returnTo,
    shop,
  });

  const response = NextResponse.redirect(new URL(redirectUrl, url.origin));
  response.headers.set("Set-Cookie", setCookie);
  return response;
}
