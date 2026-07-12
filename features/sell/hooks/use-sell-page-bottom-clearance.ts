"use client";

import { useEffect, type RefObject } from "react";

/** Minimum gap between last field and publish bar (px). */
const BAR_GAP_PX = 32;

/** Minimum bottom padding floor (px) before safe area. */
const MIN_CLEARANCE_PX = 128;

/**
 * Measures the fixed publish bar and keyboard inset, writing CSS variables on the sell shell:
 * - --sell-publish-bar-measured
 * - --sell-keyboard-offset
 * - --sell-scroll-keyboard-extra
 */
export function useSellPageBottomClearance(
  shellRef: RefObject<HTMLElement | null>,
  publishBarRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const root = shell;

    const applyBarHeight = (height: number) => {
      const measured = Math.max(height, MIN_CLEARANCE_PX - BAR_GAP_PX);
      root.style.setProperty("--sell-publish-bar-measured", `${Math.ceil(measured)}px`);
    };

    const bar = publishBarRef.current;
    if (!bar) return;

    applyBarHeight(bar.getBoundingClientRect().height);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const height =
        entry.borderBoxSize?.[0]?.blockSize ??
        entry.target.getBoundingClientRect().height;
      applyBarHeight(height);
    });
    resizeObserver.observe(bar);

    const updateKeyboard = () => {
      const vv = window.visualViewport;
      if (!vv) {
        root.style.setProperty("--sell-keyboard-offset", "0px");
        root.style.setProperty("--sell-scroll-keyboard-extra", "0px");
        return;
      }

      const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--sell-keyboard-offset", `${Math.ceil(keyboardInset)}px`);
      root.style.setProperty(
        "--sell-scroll-keyboard-extra",
        keyboardInset > 0 ? `${Math.ceil(keyboardInset)}px` : "0px",
      );
    };

    updateKeyboard();
    window.visualViewport?.addEventListener("resize", updateKeyboard);
    window.visualViewport?.addEventListener("scroll", updateKeyboard);
    window.addEventListener("resize", updateKeyboard);

    return () => {
      resizeObserver.disconnect();
      window.visualViewport?.removeEventListener("resize", updateKeyboard);
      window.visualViewport?.removeEventListener("scroll", updateKeyboard);
      window.removeEventListener("resize", updateKeyboard);
      root.style.removeProperty("--sell-publish-bar-measured");
      root.style.removeProperty("--sell-keyboard-offset");
      root.style.removeProperty("--sell-scroll-keyboard-extra");
    };
  }, [publishBarRef, shellRef]);
}
