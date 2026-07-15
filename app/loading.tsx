import { headers } from "next/headers";
import { SplashFirstPaint } from "@/components/auth/SplashFirstPaint";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HomeSkeleton } from "@/components/skeletons/PageSkeletons";
import { AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";
import { ROVEXO_PATHNAME_HEADER } from "@/lib/auth/request-pathname";

function isAuthBootPath(pathname: string): boolean {
  if (!pathname) return false;
  return AUTH_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSplashPath(pathname: string): boolean {
  return pathname === "/splash" || pathname.startsWith("/splash/");
}

/**
 * Root Suspense fallback. Auth/splash cold starts must never paint homepage
 * skeleton (looks like a blank / broken white screen on PWA open).
 */
export default async function RootLoading() {
  const headerStore = await headers();
  const pathname = headerStore.get(ROVEXO_PATHNAME_HEADER) ?? "";

  if (isAuthBootPath(pathname)) {
    return <SplashFirstPaint wordmarkOnly={isSplashPath(pathname)} />;
  }

  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home">
      <HomeSkeleton />
    </BetaAppShell>
  );
}
