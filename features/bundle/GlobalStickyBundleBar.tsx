"use client";

import { usePathname } from "next/navigation";
import { StickyBundleBar } from "@/features/bundle/StickyBundleBar";

/**
 * Persistent Sticky Bundle Bar (Owner: active bundle remains while browsing).
 * Hidden on PDP (`/listing/`) — Store is the canonical create surface; Global bar
 * is review navigation only (not a second create CTA).
 */
export function GlobalStickyBundleBar() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/listing/")) return null;
  /* Review Bundle owns its own summary UI — sticky bar duplicates it (Store keeps bar). */
  if (pathname.startsWith("/bundle/review")) return null;
  if (pathname.startsWith("/checkout")) return null;
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) return null;
  if (pathname.startsWith("/auth/")) return null;
  return <StickyBundleBar />;
}
