"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackGaPageView } from "@/lib/analytics/ga4-events";

export function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (lastPathRef.current === path) {
      return;
    }

    lastPathRef.current = path;
    trackGaPageView(path);
  }, [pathname, searchParams]);

  return null;
}
