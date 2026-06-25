import { useCallback, useEffect, useState, type RefObject } from "react";

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
    update();
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [containerRef, update]);

  return state;
}
