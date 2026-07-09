"use client";

import { useEffect } from "react";

let lockCount = 0;

/**
 * Locks document body scroll while a modal/sheet is open.
 * Reference-counted so nested overlays restore scroll correctly.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    lockCount += 1;
    if (lockCount === 1) {
      document.body.classList.add("rx-scroll-locked");
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.classList.remove("rx-scroll-locked");
      }
    };
  }, [active]);
}
