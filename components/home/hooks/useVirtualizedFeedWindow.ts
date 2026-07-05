"use client";

import { useEffect, useState, type RefObject } from "react";

const ROW_HEIGHT_ESTIMATE = 320;
const ROW_GAP = 20;
const OVERSCAN_ROWS = 2;
const VIRTUALIZE_MIN_ITEMS = 24;

type FeedWindow = {
  start: number;
  end: number;
  topSpacer: number;
  bottomSpacer: number;
  rowHeight: number;
  enabled: boolean;
};

export function useVirtualizedFeedWindow(
  itemCount: number,
  columnCount: number,
  gridRef: RefObject<HTMLDivElement | null>,
): FeedWindow {
  const [windowState, setWindowState] = useState<FeedWindow>({
    start: 0,
    end: itemCount,
    topSpacer: 0,
    bottomSpacer: 0,
    rowHeight: ROW_HEIGHT_ESTIMATE,
    enabled: false,
  });

  useEffect(() => {
    if (itemCount < VIRTUALIZE_MIN_ITEMS) {
      return;
    }

    const grid = gridRef.current;
    if (!grid) return;

    let rowHeight = ROW_HEIGHT_ESTIMATE;

    const measureRowHeight = () => {
      const card = grid.querySelector<HTMLElement>('[data-listing-card="rovexo"]');
      if (!card) return;
      const height = card.getBoundingClientRect().height;
      if (height > 0) rowHeight = height + ROW_GAP;
    };

    const update = () => {
      const node = gridRef.current;
      if (!node) return;

      measureRowHeight();

      const gridTop = node.getBoundingClientRect().top + window.scrollY;
      const viewportTop = window.scrollY;
      const viewportBottom = window.scrollY + window.innerHeight;
      const totalRows = Math.max(1, Math.ceil(itemCount / columnCount));

      const startRow = Math.max(
        0,
        Math.floor((viewportTop - gridTop) / rowHeight) - OVERSCAN_ROWS,
      );
      const endRow = Math.min(
        totalRows - 1,
        Math.ceil((viewportBottom - gridTop) / rowHeight) + OVERSCAN_ROWS,
      );

      let start = startRow * columnCount;
      let end = Math.min(itemCount, (endRow + 1) * columnCount);

      const loadTriggerIndex = Math.max(0, Math.floor(itemCount * 0.75) - 1);
      const triggerRow = Math.floor(loadTriggerIndex / columnCount);
      const triggerRowStart = triggerRow * columnCount;
      const triggerRowEnd = Math.min(itemCount, (triggerRow + 1) * columnCount);

      if (loadTriggerIndex < itemCount) {
        start = Math.min(start, triggerRowStart);
        end = Math.max(end, triggerRowEnd);
      }

      const topSpacer = startRow * rowHeight;
      const bottomSpacer = Math.max(0, (totalRows - endRow - 1) * rowHeight);

      setWindowState({
        start,
        end,
        topSpacer,
        bottomSpacer,
        rowHeight,
        enabled: true,
      });
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(grid);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [columnCount, gridRef, itemCount]);

  if (itemCount < VIRTUALIZE_MIN_ITEMS) {
    return {
      start: 0,
      end: itemCount,
      topSpacer: 0,
      bottomSpacer: 0,
      rowHeight: ROW_HEIGHT_ESTIMATE,
      enabled: false,
    };
  }

  return windowState;
}
