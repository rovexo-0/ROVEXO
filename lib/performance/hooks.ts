"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isDocumentVisible, subscribeDocumentVisibility } from "@/lib/performance/visibility";

function subscribeVisible(callback: () => void) {
  return subscribeDocumentVisibility(() => callback());
}

function getVisibleSnapshot() {
  return isDocumentVisible();
}

function getVisibleServerSnapshot() {
  return true;
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribeVisible, getVisibleSnapshot, getVisibleServerSnapshot);
}

type VisibilityPollingOptions = {
  immediate?: boolean;
  refreshOnVisible?: boolean;
};

export function useVisibilityPolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: VisibilityPollingOptions = {},
): void {
  const { immediate = true, refreshOnVisible = true } = options;
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let intervalId = 0;

    const run = () => {
      if (!isDocumentVisible()) return;
      void callbackRef.current();
    };

    const stop = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = 0;
      }
    };

    const start = () => {
      if (intervalId || !isDocumentVisible()) return;
      if (immediate) void callbackRef.current();
      intervalId = window.setInterval(run, intervalMs);
    };

    const onVisibility = () => {
      if (isDocumentVisible()) {
        if (refreshOnVisible) void callbackRef.current();
        start();
      } else {
        stop();
      }
    };

    if (isDocumentVisible()) start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", run);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", run);
    };
  }, [immediate, intervalMs, refreshOnVisible]);
}

export function useVisibilityInterval(callback: () => void, intervalMs: number): void {
  useVisibilityPolling(callback, intervalMs);
}

export function useRafLoopWhenVisible(
  tick: (now: number, deltaMs: number) => boolean | void,
  active: boolean,
): void {
  const tickRef = useRef(tick);
  const visible = useDocumentVisible();

  useEffect(() => {
    tickRef.current = tick;
  });

  useEffect(() => {
    if (!active || !visible) return;

    let frameId = 0;
    let lastFrame = performance.now();
    let cancelled = false;

    const loop = (now: number) => {
      if (cancelled || !isDocumentVisible()) return;

      const delta = Math.min((now - lastFrame) / 16.67, 2.5);
      lastFrame = now;
      const shouldContinue = tickRef.current(now, delta);
      if (shouldContinue === false || cancelled || !isDocumentVisible()) return;

      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [active, visible]);
}

export function usePauseableEffect(
  effect: (visible: boolean) => void | (() => void),
  deps: React.DependencyList,
): void {
  const visible = useDocumentVisible();
  const cleanupRef = useRef<(() => void) | void>(undefined);

  useEffect(() => {
    cleanupRef.current?.();
    cleanupRef.current = effect(visible);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, [visible, ...deps]);
}

export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);

  useEffect(() => {
    ref.current = fn;
  });

  const stableCallback = useCallback(function stableCallback(...args: never[]) {
    return ref.current(...args);
  }, []);

  return stableCallback as T;
}

export function useVisibilityState(): boolean {
  const [visible, setVisible] = useState(getVisibleSnapshot);

  useEffect(() => subscribeDocumentVisibility(setVisible), []);

  return visible;
}

type IntersectionWhenVisibleOptions = {
  targetRef: React.RefObject<Element | null>;
  enabled?: boolean;
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useIntersectionWhenVisible(
  callback: () => void,
  options: IntersectionWhenVisibleOptions,
): void {
  const visible = useDocumentVisible();
  const callbackRef = useRef(callback);
  const { targetRef, enabled = true, root, rootMargin, threshold } = options;

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const node = targetRef.current;
    if (!node || !enabled || !visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && isDocumentVisible()) {
          callbackRef.current();
        }
      },
      { root: root ?? null, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, visible, targetRef, root, rootMargin, threshold]);
}
