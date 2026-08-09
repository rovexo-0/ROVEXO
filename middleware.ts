import { NextRequest } from "next/server";
import { applySeoRouting } from "@/lib/seo/engine/middleware-handler";
import { updateSession } from "@/lib/supabase/middleware";

const STAFF_HOSTS = new Set(
  (process.env.STAFF_HOSTS ?? "staff.rovexo.co.uk,staff.localhost")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

export async function middleware(request: NextRequest) {
  const seoResponse = await applySeoRouting(request);
  if (seoResponse) return seoResponse;

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();

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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
