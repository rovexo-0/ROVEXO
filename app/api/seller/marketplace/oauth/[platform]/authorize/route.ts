import { NextResponse } from "next/server";
import { requireApiAuth, requireApiMarketplaceOAuth } from "@/lib/auth/session";
import { buildOAuthAuthorizeResponse } from "@/lib/seller/marketplace/oauth/service";
import { isOAuthPlatform, type OAuthPlatformId } from "@/lib/seller/marketplace/oauth/types";
import { isOAuthPlatformConfigured } from "@/lib/seller/marketplace/oauth/env";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

function redirectImportOAuthError(
  request: Request,
  returnTo: string | null,
  code: "auth_required" | "forbidden" | "unconfigured",
): NextResponse {
  const origin = new URL(request.url).origin;
  const safeReturn = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account/bring-your-item";
  const target = new URL(safeReturn, origin);
  target.searchParams.set("oauth", code);
  return NextResponse.redirect(target);
}

export async function GET(request: Request, context: RouteContext) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo");

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("next", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const roleCheck = await requireApiMarketplaceOAuth();
  if (roleCheck instanceof NextResponse) {
    return redirectImportOAuthError(request, returnTo, "forbidden");
  }

  const { platform } = await context.params;
  if (!isOAuthPlatform(platform)) {
    return NextResponse.json({ error: "Unsupported OAuth platform." }, { status: 400 });
  }

  const shop = url.searchParams.get("shop");

  if (!isOAuthPlatformConfigured(platform as OAuthPlatformId)) {
    return redirectImportOAuthError(request, returnTo, "unconfigured");
  }

  const { redirectUrl, setCookie } = buildOAuthAuthorizeResponse({
    platform: platform as OAuthPlatformId,
    sellerId: auth.user.id,
    returnTo,
    shop,
  });

  const target =
    redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")
      ? redirectUrl
      : new URL(redirectUrl, url.origin).toString();
  const response = NextResponse.redirect(target);
  response.headers.set("Set-Cookie", setCookie);
  return response;
}
