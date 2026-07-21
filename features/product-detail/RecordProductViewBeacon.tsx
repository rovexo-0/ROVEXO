"use client";

/**
 * Product page ONLY — RecordProductViewBeacon (View Master Architect L7).
 *
 * +1 view only if:
 * product page loaded · exists · published · visible · dwell ≥ 1.5s ·
 * not admin/super_admin/bot · not counted in 24h · DATABASE insert success
 * → publishViewLive. Homepage/Search/Saved/Store never call this.
 */

import { useEffect, useRef } from "react";
import { publishViewLive } from "@/lib/views/view-live-sync";

const DWELL_MS = 1500;

type RecordProductViewBeaconProps = {
  productSlug: string;
};

export function RecordProductViewBeacon({ productSlug }: RecordProductViewBeaconProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!productSlug || firedRef.current) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let visible = typeof document !== "undefined" && document.visibilityState === "visible";
    let intersecting = true;

    const clearTimer = () => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const run = async () => {
      if (cancelled || firedRef.current) return;
      if (!visible || !intersecting) return;
      firedRef.current = true;

      try {
        const response = await fetch("/api/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productSlug }),
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as {
          counted?: boolean;
          views?: number | null;
        };
        if (
          payload.counted === true &&
          typeof payload.views === "number" &&
          Number.isFinite(payload.views)
        ) {
          publishViewLive({ slug: productSlug, views: payload.views });
        }
      } catch {
        // fail closed — no UI counter
      }
    };

    const schedule = () => {
      clearTimer();
      if (cancelled || firedRef.current) return;
      if (!visible || !intersecting) return;
      timer = setTimeout(() => {
        void run();
      }, DWELL_MS);
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (!visible) {
        clearTimer();
        return;
      }
      schedule();
    };

    const root = document.querySelector<HTMLElement>("[data-pd-detail-version]");
    let observer: IntersectionObserver | null = null;

    if (root && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          intersecting = entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.15,
          );
          if (!intersecting) {
            clearTimer();
            return;
          }
          schedule();
        },
        { threshold: [0, 0.15, 0.5, 1] },
      );
      observer.observe(root);
    } else {
      intersecting = true;
      schedule();
    }

    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      cancelled = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [productSlug]);

  return null;
}
