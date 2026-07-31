"use client";

import { useEffect, type RefObject } from "react";

/** Minimum gap between last field and sticky publish CTA (px). */
const BAR_GAP_PX = 12;

/**
 * Measures the sticky publish CTA and writes Account-compatible clearance on the sell shell:
 * --sell-sticky-clearance = bar height + gap + --cds-bottom-nav-offset
 * (same token Account sticky actions use — clears Bottom Nav + safe area).
 */
export function useSellPageBottomClearance(
  shellRef: RefObject<HTMLElement | null>,
  publishBarRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const applyBarHeight = (height: number) => {
      const barPart = Math.ceil(Math.max(height + BAR_GAP_PX, 72));
      shell.style.setProperty(
        "--sell-sticky-clearance",
        `calc(${barPart}px + var(--cds-bottom-nav-offset, 72px))`,
      );
    };

    const bar = publishBarRef.current;
    if (!bar) return;

    applyBarHeight(bar.getBoundingClientRect().height);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const height =
        entry.borderBoxSize?.[0]?.blockSize ??
        entry.contentRect.height ??
        bar.getBoundingClientRect().height;
      applyBarHeight(height);
    });
    resizeObserver.observe(bar);

    return () => {
      resizeObserver.disconnect();
    };
  }, [publishBarRef, shellRef]);
}
