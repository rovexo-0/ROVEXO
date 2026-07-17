import { headers } from "next/headers";
import { SplashFirstPaint } from "@/components/auth/SplashFirstPaint";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HomeSkeleton } from "@/components/skeletons/PageSkeletons";
import { AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";
import { ROVEXO_PATHNAME_HEADER } from "@/lib/auth/request-pathname";

function isAuthBootPath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname === "/splash" || pathname.startsWith("/splash/")) return true;
  if (pathname === "/welcome" || pathname.startsWith("/welcome/")) return true;
  return AUTH_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Root Suspense fallback. Auth cold starts must never paint homepage skeleton.
 */
export default async function RootLoading() {
  const headerStore = await headers();
  const pathname = headerStore.get(ROVEXO_PATHNAME_HEADER) ?? "";

  if (isAuthBootPath(pathname)) {
    return <SplashFirstPaint wordmarkOnly />;
  }

  return (
    <BetaAppShell bottomNavTab="home" className="rovexo-page-home">
      <HomeSkeleton />
    </BetaAppShell>
  );
}
