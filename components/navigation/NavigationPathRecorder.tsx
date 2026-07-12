"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { syncNavigationPath } from "@/lib/navigation/session-navigation";

/** Tracks prior pathname in sessionStorage for smart listing back fallbacks. */
export function NavigationPathRecorder() {
  const pathname = usePathname() ?? "/";
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    syncNavigationPath(lastPathRef.current, pathname);
    lastPathRef.current = pathname;
  }, [pathname]);

  return null;
}
