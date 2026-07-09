"use client";

import { useMobileInputScroll } from "@/hooks/use-mobile-input-scroll";

/** Global mobile scroll helpers — input focus scroll-into-view. */
export function MobileScrollBootstrap() {
  useMobileInputScroll(true);
  return null;
}
