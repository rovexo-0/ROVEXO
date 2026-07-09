import { NextRequest, NextResponse } from "next/server";
import { getSeoRedirect } from "@/lib/seo/engine/redirects";
import { resolveLocationFirstRewrite, shouldRewriteToDiscover } from "@/lib/seo/engine/routing";

const RESERVED_ROOT_SEGMENTS = new Set([
  "account",
  "admin",
  "api",
  "auctions",
  "auth",
  "brand",
  "browse",
  "business",
  "buyer",
  "cart",
  "categories",
  "category",
  "checkout",
  "collections",
  "discover",
  "help",
  "import",
  "integrations",
  "listing",
  "login",
  "l",
  "messages",
  "notifications",
  "orders",
  "payments",
  "plans",
  "privacy",
  "protection",
  "register",
  "resolution",
  "saved",
  "search",
  "sell",
  "seller",
  "settings",
  "staff",
  "store",
  "super-admin",
  "support",
  "terms",
  "trends",
  "user",
  "verify-email",
  "wallet",
  "403",
  "404",
  "500",
  "_next",
]);

/**
 * Apply automated SEO redirects and rewrites before route handling.
 * - DB-backed 301/302 from seo_redirects
 * - Root discovery slugs → /discover/{slug}
 * - Location-first URLs → /l/{location}/{category}
 */
export async function applySeoRouting(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  const redirect = await getSeoRedirect(pathname);
  if (redirect) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = redirect.targetPath;
    targetUrl.search = request.nextUrl.search;
    return NextResponse.redirect(targetUrl, redirect.statusCode);
  }

  const discoverRewrite = shouldRewriteToDiscover(pathname);
  if (discoverRewrite) {
    const firstSegment = pathname.split("/").filter(Boolean)[0]!;
    if (!RESERVED_ROOT_SEGMENTS.has(firstSegment)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = discoverRewrite;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  const locationRewrite = resolveLocationFirstRewrite(pathname);
  if (locationRewrite) {
    const firstSegment = pathname.split("/").filter(Boolean)[0]!;
    if (!RESERVED_ROOT_SEGMENTS.has(firstSegment)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = locationRewrite;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return null;
}
