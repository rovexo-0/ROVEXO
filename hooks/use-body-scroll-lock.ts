"use client";

import { useEffect } from "react";

let lockCount = 0;

/**
 * Force-release every body scroll lock.
 * Safety net when a modal unmounts without running effect cleanup.
 */
export function clearBodyScrollLock(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.body.classList.remove("rx-scroll-locked");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("touch-action");
  document.documentElement.classList.remove("rx-scroll-locked");
  document.documentElement.style.removeProperty("overflow");
}

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
        clearBodyScrollLock();
      }
    };
  }, [active]);
}
