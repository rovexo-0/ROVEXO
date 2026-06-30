"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const LOOP_COPIES = 3;
const AUTO_SCROLL_PX_PER_FRAME = 0.35;
const RESUME_DELAY_MS = 1400;
const DRAG_THRESHOLD_PX = 4;

type UseInfiniteCarouselOptions = {
  itemCount: number;
  trackSelector?: string;
  autoScrollSpeed?: number;
};

type UseInfiniteCarouselResult = {
  scrollerRef: RefObject<HTMLDivElement | null>;
  loopCopies: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onScroll: () => void;
  shouldSuppressClick: () => boolean;
};

export function useInfiniteCarousel({
  itemCount,
  trackSelector = ".premium-infinite-track",
  autoScrollSpeed = AUTO_SCROLL_PX_PER_FRAME,
}: UseInfiniteCarouselOptions): UseInfiniteCarouselResult {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const setWidthRef = useRef(0);
  const rafRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const dragMovedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const initializedRef = useRef(false);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearResumeTimer();
  }, [clearResumeTimer]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      if (!isDragging.current) pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, [clearResumeTimer]);

  const measureSetWidth = useCallback(() => {
    const scroller = scrollerRef.current;
    const track = scroller?.querySelector<HTMLElement>(trackSelector);
    if (!scroller || !track || track.scrollWidth <= 0) return 0;
    const measured = track.scrollWidth / LOOP_COPIES;
    setWidthRef.current = measured;
    return measured;
  }, [trackSelector]);

  const normalizeScroll = useCallback((behavior: ScrollBehavior = "auto") => {
    const scroller = scrollerRef.current;
    const setWidth = setWidthRef.current;
    if (!scroller || setWidth <= 0) return;
    if (scroller.scrollLeft >= setWidth * 2 - 1) {
      scroller.scrollTo({ left: scroller.scrollLeft - setWidth, behavior });
    } else if (scroller.scrollLeft <= 1) {
      scroller.scrollTo({ left: scroller.scrollLeft + setWidth, behavior });
    }
  }, []);

  const initializeScrollPosition = useCallback(() => {
    const scroller = scrollerRef.current;
    const setWidth = measureSetWidth();
    if (!scroller || setWidth <= 0 || initializedRef.current) return;
    scroller.scrollLeft = setWidth;
    initializedRef.current = true;
    pausedRef.current = false;
  }, [measureSetWidth]);

  useLayoutEffect(() => {
    initializeScrollPosition();
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const resizeObserver = new ResizeObserver(() => {
      const previousSetWidth = setWidthRef.current;
      const nextSetWidth = measureSetWidth();
      if (!initializedRef.current && nextSetWidth > 0) {
        initializeScrollPosition();
        return;
      }
      if (previousSetWidth > 0 && nextSetWidth > 0 && previousSetWidth !== nextSetWidth) {
        const ratio = scroller.scrollLeft / previousSetWidth;
        scroller.scrollLeft = ratio * nextSetWidth;
      }
    });

    resizeObserver.observe(scroller);
    const track = scroller.querySelector(trackSelector);
    if (track) resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, [initializeScrollPosition, itemCount, measureSetWidth, trackSelector]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches) pausedRef.current = true;
    };
    syncReducedMotion();
    media.addEventListener("change", syncReducedMotion);

    const tick = () => {
      const scroller = scrollerRef.current;
      if (
        scroller &&
        !pausedRef.current &&
        !reducedMotionRef.current &&
        !isDragging.current &&
        setWidthRef.current > 0
      ) {
        scroller.scrollLeft += autoScrollSpeed;
        normalizeScroll();
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      media.removeEventListener("change", syncReducedMotion);
      window.cancelAnimationFrame(rafRef.current);
      clearResumeTimer();
    };
  }, [autoScrollSpeed, clearResumeTimer, normalizeScroll]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleWheel = (event: WheelEvent) => {
      const dominantVertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
      if (!dominantVertical && event.deltaX === 0) return;
      event.preventDefault();
      pause();
      scroller.scrollLeft += dominantVertical ? event.deltaY : event.deltaX;
      normalizeScroll();
      scheduleResume();
    };

    scroller.addEventListener("wheel", handleWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", handleWheel);
  }, [normalizeScroll, pause, scheduleResume]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      pause();
      isDragging.current = true;
      dragMovedRef.current = false;
      pointerIdRef.current = event.pointerId;
      dragStartRef.current = { x: event.clientX, scrollLeft: scroller.scrollLeft };
      scroller.classList.add("premium-infinite--dragging");
      try {
        scroller.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    },
    [pause],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || pointerIdRef.current !== event.pointerId) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const delta = event.clientX - dragStartRef.current.x;
      if (Math.abs(delta) > DRAG_THRESHOLD_PX) dragMovedRef.current = true;
      scroller.scrollLeft = dragStartRef.current.scrollLeft - delta;
      normalizeScroll();
    },
    [normalizeScroll],
  );

  const releasePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      const scroller = scrollerRef.current;
      if (scroller?.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
      isDragging.current = false;
      pointerIdRef.current = null;
      scroller?.classList.remove("premium-infinite--dragging");
      normalizeScroll();
      scheduleResume();
    },
    [normalizeScroll, scheduleResume],
  );

  return {
    scrollerRef,
    loopCopies: LOOP_COPIES,
    onPointerDown,
    onPointerMove,
    onPointerUp: releasePointer,
    onPointerCancel: releasePointer,
    onMouseEnter: pause,
    onMouseLeave: () => {
      if (!isDragging.current) scheduleResume();
    },
    onTouchStart: pause,
    onTouchEnd: () => {
      if (!isDragging.current) scheduleResume();
    },
    onScroll: () => {
      normalizeScroll();
      if (pausedRef.current && !isDragging.current) scheduleResume();
    },
    shouldSuppressClick: () => dragMovedRef.current,
  };
}
