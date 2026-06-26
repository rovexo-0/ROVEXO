"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { throttle } from "@/lib/performance/throttle";
import { useDocumentVisible } from "@/lib/performance/hooks";

const SCROLL_DOWN_THRESHOLD = 40;
const MOBILE_MEDIA = "(max-width: 1023px)";

type MobileHeaderScrollContextValue = {
  isVisible: boolean;
  headerHeight: number;
  registerHeader: (element: HTMLElement | null) => void;
};

const MobileHeaderScrollContext = createContext<MobileHeaderScrollContextValue | null>(null);

export function useMobileHeaderScrollContext() {
  return useContext(MobileHeaderScrollContext);
}

function getScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_MEDIA).matches;
}

export function MobileHeaderScrollProvider({ children }: { children: ReactNode }) {
  const visible = useDocumentVisible();
  const [isVisible, setIsVisible] = useState(true);
  const [headerElement, setHeaderElement] = useState<HTMLElement | null>(null);
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);
  const lastScrollY = useRef(0);
  const scrollDownDistance = useRef(0);

  const headerHeight = headerElement ? measuredHeaderHeight : 0;

  const updateHeaderHeight = useCallback((element: HTMLElement) => {
    const nextHeight = element.offsetHeight;
    setMeasuredHeaderHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  const registerHeader = useCallback((element: HTMLElement | null) => {
    setHeaderElement((current) => (current === element ? current : element));
  }, []);

  useLayoutEffect(() => {
    if (!headerElement || !visible) {
      return;
    }

    const handleMeasure = () => {
      updateHeaderHeight(headerElement);
    };

    handleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleMeasure) : null;

    resizeObserver?.observe(headerElement);
    window.addEventListener("resize", handleMeasure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleMeasure);
    };
  }, [headerElement, updateHeaderHeight, visible]);

  useLayoutEffect(() => {
    if (!visible) return;

    const handleScroll = throttle(() => {
      if (!isMobileViewport()) {
        scrollDownDistance.current = 0;
        lastScrollY.current = getScrollY();
        setIsVisible((current) => (current ? current : true));
        return;
      }

      const currentScrollY = getScrollY();
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 0) {
        scrollDownDistance.current = 0;
        setIsVisible((current) => (current ? current : true));
      } else if (scrollDelta > 0) {
        scrollDownDistance.current += scrollDelta;
        if (scrollDownDistance.current > SCROLL_DOWN_THRESHOLD) {
          setIsVisible((current) => (current ? false : current));
        }
      } else if (scrollDelta < 0) {
        scrollDownDistance.current = 0;
        setIsVisible((current) => (current ? current : true));
      }

      lastScrollY.current = currentScrollY;
    }, 16);

    lastScrollY.current = getScrollY();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [visible]);

  const contextValue = useMemo(
    () => ({
      isVisible,
      headerHeight,
      registerHeader,
    }),
    [headerHeight, isVisible, registerHeader],
  );

  return (
    <MobileHeaderScrollContext.Provider value={contextValue}>
      <div
        aria-hidden
        suppressHydrationWarning
        className="overflow-hidden transition-[height] duration-[220ms] ease-in-out lg:hidden"
        style={{ height: isVisible ? headerHeight : 0 }}
      />
      {children}
    </MobileHeaderScrollContext.Provider>
  );
}
