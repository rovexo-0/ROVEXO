import { useCallback, useEffect, useState, type RefObject } from "react";
import { useDocumentVisible } from "@/lib/performance/hooks";
import { throttle } from "@/lib/performance/throttle";

type VirtualListState = {
  startIndex: number;
  endIndex: number;
  offsetTop: number;
  totalHeight: number;
};

export function useVirtualList(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  itemHeight: number,
  overscan = 4,
): VirtualListState {
  const [state, setState] = useState<VirtualListState>({
    startIndex: 0,
    endIndex: Math.min(itemCount, 12),
    offsetTop: 0,
    totalHeight: itemCount * itemHeight,
  });

  const visible = useDocumentVisible();

  const update = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    const scrollTop = element.scrollTop;
    const viewport = element.clientHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewport / itemHeight) + overscan * 2;
    const endIndex = Math.min(itemCount, startIndex + visibleCount);

    setState({
      startIndex,
      endIndex,
      offsetTop: startIndex * itemHeight,
      totalHeight: itemCount * itemHeight,
    });
  }, [containerRef, itemCount, itemHeight, overscan]);

  useEffect(() => {
    if (!visible) return;

    update();
    const element = containerRef.current;
    if (!element) return;

    const onScroll = throttle(update, 16);
    element.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      element.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef, update, visible]);

  return state;
}
