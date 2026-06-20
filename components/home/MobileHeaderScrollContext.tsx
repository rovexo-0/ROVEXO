"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const [isVisible, setIsVisible] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [headerVersion, setHeaderVersion] = useState(0);
  const headerElementRef = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const scrollDownDistance = useRef(0);

  const registerHeader = useCallback((element: HTMLElement | null) => {
    if (headerElementRef.current === element) return;
  
    headerElementRef.current = element;
  
    const nextHeight = element?.offsetHeight ?? 0;
  
    setHeaderHeight((current) =>
      current === nextHeight ? current : nextHeight
    );
  }, []);

  useLayoutEffect(() => {
    function handleScroll() {
      if (!isMobileViewport()) {
        scrollDownDistance.current = 0;
        lastScrollY.current = getScrollY();
        setIsVisible(true);
        return;
      }

      const currentScrollY = getScrollY();
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 0) {
        scrollDownDistance.current = 0;
        setIsVisible(true);
      } else if (scrollDelta > 0) {
        scrollDownDistance.current += scrollDelta;
        if (scrollDownDistance.current > SCROLL_DOWN_THRESHOLD) {
          setIsVisible(false);
        }
      } else if (scrollDelta < 0) {
        scrollDownDistance.current = 0;
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    }

    lastScrollY.current = getScrollY();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    const element = headerElementRef.current;
    if (!element) return;

    function measureHeader() {
      if (!element) return;
      setHeaderHeight(element.offsetHeight);
    }

    measureHeader();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureHeader) : null;

    resizeObserver?.observe(element);
    window.addEventListener("resize", measureHeader);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureHeader);
    };
  }, [headerVersion]);

  return (
    <MobileHeaderScrollContext.Provider value={{ isVisible, headerHeight, registerHeader }}>
      <div
        aria-hidden
        className="overflow-hidden transition-[height] duration-200 ease-in-out lg:hidden"
        style={{ height: isVisible ? headerHeight : 0 }}
      />
      {children}
    </MobileHeaderScrollContext.Provider>
  );
}
