"use client";

import { usePathname } from "next/navigation";
import { StickyBundleBar } from "@/features/bundle/StickyBundleBar";

/**
 * Persistent Sticky Bundle Bar outside View Item (Owner: leaving listing — bar remains).
 * View Item mounts its own host so the bar sits above the product action bar.
 */
export function GlobalStickyBundleBar() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/listing/")) return null;
  if (pathname.startsWith("/checkout")) return null;
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) return null;
  if (pathname.startsWith("/auth/")) return null;
  return <StickyBundleBar />;
}
