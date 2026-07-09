import { NextRequest, NextResponse } from "next/server";
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
  if (host && STAFF_HOSTS.has(host) && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/staff";
    return updateSession(new NextRequest(url, request));
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
