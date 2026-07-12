"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resolveBackRoute } from "@/lib/navigation/back-routes";
import { resolveListingBackFallback } from "@/lib/navigation/listing-back";
import { readPreviousNavigationPath } from "@/lib/navigation/session-navigation";
import { bumpSessionVisitDepth } from "@/lib/navigation/session-visit-depth";

export type UsePageBackOptions = {
  backHref?: string;
  backLabel?: string;
  preferHistory?: boolean;
};

export function usePageBack(options: UsePageBackOptions = {}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const visitDepthRef = useRef<number | null>(null);

  if (visitDepthRef.current === null) {
    visitDepthRef.current = bumpSessionVisitDepth();
  }

  const resolved = useMemo(() => resolveBackRoute(pathname), [pathname]);

  const visible = Boolean(options.backHref ?? resolved);
  const href = options.backHref ?? resolved?.parentHref ?? "/";
  const label = options.backLabel ?? resolved?.label ?? "Back";

  const goBack = useCallback(() => {
    if (!options.preferHistory && options.backHref) {
      router.push(href);
      return;
    }

    const visitDepth = visitDepthRef.current ?? 1;
    const canHistoryBack =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      visitDepth > 1;

    if (options.preferHistory !== false && canHistoryBack) {
      router.back();
      return;
    }

    const listingFallback = pathname.startsWith("/listing/")
      ? resolveListingBackFallback(readPreviousNavigationPath())
      : null;

    router.push(listingFallback ?? options.backHref ?? resolved?.parentHref ?? "/");
  }, [href, options.backHref, options.preferHistory, pathname, resolved?.parentHref, router]);

  return {
    visible,
    href,
    label,
    goBack,
    onClick: goBack,
  };
}
