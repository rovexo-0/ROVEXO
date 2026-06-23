"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackGaPageView } from "@/lib/analytics/ga4-events";

/**
 * Sends `page_view` on App Router client navigations.
 * The initial load is handled by `@next/third-parties/google` gtag config.
 */
export function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      lastPathRef.current = path;
      return;
    }

    if (lastPathRef.current === path) {
      return;
    }

    lastPathRef.current = path;
    trackGaPageView(path);
  }, [pathname, searchParams]);

  return null;
}
