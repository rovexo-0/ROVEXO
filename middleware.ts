import { NextRequest, NextResponse } from "next/server";
import {
  HSTS_PRODUCTION_VALUE,
  PRODUCTION_CSP,
  PRODUCTION_CSP_LOOPBACK,
  isLoopbackHost,
} from "@/lib/ops/security-headers";
import { applySeoRouting } from "@/lib/seo/engine/middleware-handler";
import { updateSession } from "@/lib/supabase/middleware";

const STAFF_HOSTS = new Set(
  (process.env.STAFF_HOSTS ?? "staff.rovexo.co.uk,staff.localhost")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

const isProductionRuntime = process.env.NODE_ENV === "production";

function applyHostAwareProductionSecurity(
  response: NextResponse,
  host: string | undefined,
): void {
  if (!isProductionRuntime) return;
  if (isLoopbackHost(host)) {
    response.headers.set("Content-Security-Policy", PRODUCTION_CSP_LOOPBACK);
    response.headers.delete("Strict-Transport-Security");
    return;
  }
  response.headers.set("Content-Security-Policy", PRODUCTION_CSP);
  response.headers.set("Strict-Transport-Security", HSTS_PRODUCTION_VALUE);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

  const seoResponse = await applySeoRouting(request);
  if (seoResponse) {
    applyHostAwareProductionSecurity(seoResponse, host);
    return seoResponse;
  }

  // Isolate draft visual preview onto a private force-dynamic route so `/` stays cookie-free ISR.
  // Browser URL remains `/?visualPreview=draft` (ThemeStudio links unchanged).
  const isHomepageDraftPreview =
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.get("visualPreview") === "draft";

  let response;
  if (host && STAFF_HOSTS.has(host) && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/staff";
    response = await updateSession(new NextRequest(url, request));
  } else if (isHomepageDraftPreview) {
    const url = request.nextUrl.clone();
    url.pathname = "/homepage-visual-draft";
    response = await updateSession(new NextRequest(url, request));
  } else {
    response = await updateSession(request);
  }

  // Anonymous Homepage only: align CDN TTL with `export const revalidate = 60`.
  // Never public-cache when auth cookies exist or middleware set cookies (session refresh).
  const isAnonymousHomepage =
    request.nextUrl.pathname === "/" &&
    !isHomepageDraftPreview &&
    !request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token")) &&
    response.cookies.getAll().length === 0;
  if (isAnonymousHomepage) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
  }

  /*
   * HTTPS upgrade + HSTS are host-aware (not in next.config static headers):
   * - Production public hosts → full PRODUCTION_CSP + HSTS
   * - Loopback (localhost / 127.0.0.1) → CSP without upgrade; no HSTS
   * Prevents Lighthouse ERR_SSL_PROTOCOL_ERROR on http://localhost:3000/wallet prefetch.
   */
  applyHostAwareProductionSecurity(response, host);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
