"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const LOOP_COPIES = 3;
const AUTO_SCROLL_PX_PER_FRAME = 0.5;
const RESUME_DELAY_MS = 480;
const DRAG_THRESHOLD_PX = 4;
// A touch must travel this far and be more horizontal than vertical before the
// carousel claims the gesture. Below this, the browser keeps the touch so
// vertical page scrolling stays smooth and always takes priority on iOS Safari.
const DIRECTION_LOCK_THRESHOLD_PX = 12;
const MOBILE_MAX_WIDTH_PX = 1023;

type GestureAxis = "none" | "horizontal" | "vertical";

type UseInfiniteCarouselOptions = {
  itemCount: number;
  trackSelector?: string;
  autoScrollSpeed?: number;
  mobileOnly?: boolean;
  enableMomentum?: boolean;
  resumeDelayMs?: number;
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
  mobileOnly = false,
  enableMomentum = false,
  resumeDelayMs = RESUME_DELAY_MS,
}: UseInfiniteCarouselOptions): UseInfiniteCarouselResult {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const mobileActiveRef = useRef(!mobileOnly);
  const setWidthRef = useRef(0);
  const rafRef = useRef(0);
  const momentumRafRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const dragMovedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0 });
  const gestureAxisRef = useRef<GestureAxis>("none");
  const scrollSampleRef = useRef({ scrollLeft: 0, time: 0 });
  const velocityRef = useRef(0);
  const initializedRef = useRef(false);
  /** Window-level drag listeners — avoids setPointerCapture/releasePointerCapture NotFoundError on Safari. */
  const windowDragCleanupRef = useRef<(() => void) | null>(null);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const stopMomentum = useCallback(() => {
    if (momentumRafRef.current) {
      window.cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = 0;
    }
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearResumeTimer();
    stopMomentum();
  }, [clearResumeTimer, stopMomentum]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      if (!isDragging.current && mobileActiveRef.current) {
        pausedRef.current = false;
      }
    }, resumeDelayMs);
  }, [clearResumeTimer, resumeDelayMs]);

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
    pausedRef.current = !mobileActiveRef.current;
  }, [measureSetWidth]);

  const runMomentumRef = useRef<() => void>(() => {});

  const runMomentum = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    velocityRef.current *= 0.92;
    if (Math.abs(velocityRef.current) < 0.15) {
      velocityRef.current = 0;
      scheduleResume();
      return;
    }

    scroller.scrollLeft += velocityRef.current;
    normalizeScroll();
    momentumRafRef.current = window.requestAnimationFrame(() => runMomentumRef.current());
  }, [normalizeScroll, scheduleResume]);

  useLayoutEffect(() => {
    runMomentumRef.current = runMomentum;
  }, [runMomentum]);

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
    if (!mobileOnly) return;

    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const syncMobile = () => {
      mobileActiveRef.current = media.matches;
      if (!media.matches) {
        pausedRef.current = true;
        stopMomentum();
      } else if (!isDragging.current && initializedRef.current) {
        pausedRef.current = false;
      }
    };

    syncMobile();
    media.addEventListener("change", syncMobile);
    return () => media.removeEventListener("change", syncMobile);
  }, [mobileOnly, stopMomentum]);

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
        !momentumRafRef.current &&
        setWidthRef.current > 0 &&
        (!mobileOnly || mobileActiveRef.current)
      ) {
        scroller.scrollLeft -= autoScrollSpeed;
        normalizeScroll();
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      media.removeEventListener("change", syncReducedMotion);
      window.cancelAnimationFrame(rafRef.current);
      stopMomentum();
      clearResumeTimer();
      windowDragCleanupRef.current?.();
      windowDragCleanupRef.current = null;
    };
  }, [autoScrollSpeed, clearResumeTimer, mobileOnly, normalizeScroll, stopMomentum]);

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

  const detachWindowDrag = useCallback(() => {
    windowDragCleanupRef.current?.();
    windowDragCleanupRef.current = null;
  }, []);

  const finishHorizontalDrag = useCallback(() => {
    const scroller = scrollerRef.current;
    const wasHorizontalDrag = gestureAxisRef.current === "horizontal" && isDragging.current;
    detachWindowDrag();
    isDragging.current = false;
    pointerIdRef.current = null;
    gestureAxisRef.current = "none";
    scroller?.classList.remove("premium-infinite--dragging");

    if (!wasHorizontalDrag) {
      scheduleResume();
      return;
    }

    normalizeScroll();

    if (enableMomentum && Math.abs(velocityRef.current) > 0.35) {
      pausedRef.current = true;
      momentumRafRef.current = window.requestAnimationFrame(runMomentum);
      return;
    }

    scheduleResume();
  }, [detachWindowDrag, enableMomentum, normalizeScroll, runMomentum, scheduleResume]);

  const engageHorizontalDrag = useCallback(
    (scroller: HTMLDivElement, event: React.PointerEvent<HTMLDivElement>) => {
      gestureAxisRef.current = "horizontal";
      isDragging.current = true;
      // Re-anchor to the current point so drag begins with zero delta (no jump).
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: scroller.scrollLeft,
      };
      scrollSampleRef.current = { scrollLeft: scroller.scrollLeft, time: performance.now() };
      scroller.classList.add("premium-infinite--dragging");

      // Track the active pointer on window — never setPointerCapture.
      // Safari throws NotFoundError on releasePointerCapture even after a
      // successful hasPointerCapture check when the capture is already gone.
      detachWindowDrag();
      const pointerId = event.pointerId;
      const onWindowMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        if (gestureAxisRef.current !== "horizontal" || !isDragging.current) return;
        const active = scrollerRef.current;
        if (!active) return;

        const delta = moveEvent.clientX - dragStartRef.current.x;
        if (Math.abs(delta) > DRAG_THRESHOLD_PX) dragMovedRef.current = true;
        active.scrollLeft = dragStartRef.current.scrollLeft - delta;
        normalizeScroll();

        const now = performance.now();
        const elapsed = now - scrollSampleRef.current.time;
        if (elapsed > 0) {
          const scrollDelta = active.scrollLeft - scrollSampleRef.current.scrollLeft;
          velocityRef.current = (scrollDelta / elapsed) * 16.67;
        }
        scrollSampleRef.current = { scrollLeft: active.scrollLeft, time: now };
      };
      const onWindowUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        finishHorizontalDrag();
      };
      window.addEventListener("pointermove", onWindowMove);
      window.addEventListener("pointerup", onWindowUp);
      window.addEventListener("pointercancel", onWindowUp);
      windowDragCleanupRef.current = () => {
        window.removeEventListener("pointermove", onWindowMove);
        window.removeEventListener("pointerup", onWindowUp);
        window.removeEventListener("pointercancel", onWindowUp);
      };
    },
    [detachWindowDrag, finishHorizontalDrag, normalizeScroll],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      pause();
      dragMovedRef.current = false;
      pointerIdRef.current = event.pointerId;
      velocityRef.current = 0;
      dragStartRef.current = { x: event.clientX, y: event.clientY, scrollLeft: scroller.scrollLeft };
      scrollSampleRef.current = { scrollLeft: scroller.scrollLeft, time: performance.now() };

      // Stay undecided — plain click/tap must reach the card link. Vertical page
      // scroll must win on touch until horizontal intent is proven.
      gestureAxisRef.current = "none";
      isDragging.current = false;
    },
    [pause],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      // Once window listeners own the drag, ignore element move events.
      if (gestureAxisRef.current === "horizontal" && isDragging.current) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      if (gestureAxisRef.current === "none") {
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (event.pointerType === "mouse") {
          if (absX < DRAG_THRESHOLD_PX && absY < DRAG_THRESHOLD_PX) return;
          engageHorizontalDrag(scroller, event);
        } else {
          if (absX < DIRECTION_LOCK_THRESHOLD_PX && absY < DIRECTION_LOCK_THRESHOLD_PX) {
            return;
          }
          if (absY >= absX) {
            gestureAxisRef.current = "vertical";
            scheduleResume();
            return;
          }
          engageHorizontalDrag(scroller, event);
        }
      }
    },
    [engageHorizontalDrag, scheduleResume],
  );

  const releasePointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      // If window drag is active, window pointerup owns finishHorizontalDrag.
      if (windowDragCleanupRef.current) return;
      finishHorizontalDrag();
    },
    [finishHorizontalDrag],
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
      if (!isDragging.current && !momentumRafRef.current) scheduleResume();
    },
    onScroll: () => {
      normalizeScroll();
      if (pausedRef.current && !isDragging.current && !momentumRafRef.current) scheduleResume();
    },
    shouldSuppressClick: () => dragMovedRef.current,
  };
}
