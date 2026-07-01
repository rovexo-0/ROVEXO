"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resolveBackRoute } from "@/lib/navigation/back-routes";

export type UsePageBackOptions = {
  backHref?: string;
  backLabel?: string;
  preferHistory?: boolean;
};

export function usePageBack(options: UsePageBackOptions = {}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const resolved = useMemo(() => resolveBackRoute(pathname), [pathname]);

  const visible = Boolean(options.backHref ?? resolved);
  const href = options.backHref ?? resolved?.parentHref ?? "/";
  const label = options.backLabel ?? resolved?.label ?? "Back";

  const goBack = useCallback(() => {
    if (!options.preferHistory && options.backHref) {
      router.push(href);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(href);
  }, [href, options.backHref, options.preferHistory, router]);

  return {
    visible,
    href,
    label,
    goBack,
    onClick: goBack,
  };
}
