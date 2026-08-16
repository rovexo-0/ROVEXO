"use client";

import { useEffect, useState } from "react";
import {
  REGISTERED_USER_COUNT_V1,
  formatRegisteredUserCount,
} from "@/lib/platform/registered-user-count-client-v1";
import {
  subscribeRegisteredUserCount,
  unsubscribeRegisteredUserCount,
} from "@/lib/platform/subscribe-registered-user-count-v1";

/**
 * Homepage header registered-user counter — fail closed.
 * Renders nothing until a verified count is available.
 * Visible UI only: 👥 {compact} — no pill/border/badge/label text.
 */
export function HomepageRegisteredUserCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof subscribeRegisteredUserCount> = null;

    const load = async () => {
      try {
        const res = await fetch(REGISTERED_USER_COUNT_V1.apiPath, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as { ok?: boolean; count?: number };
        if (!body.ok || typeof body.count !== "number" || !Number.isFinite(body.count) || body.count < 0) {
          return;
        }
        if (!cancelled) {
          setCount(Math.floor(body.count));
        }
      } catch {
        /* fail closed — leave count null */
      }
    };

    const start = () => {
      void load().then(() => {
        if (cancelled) return;
        channel = subscribeRegisteredUserCount({
          onInsert: () => setCount((prev) => (prev == null ? prev : prev + 1)),
          onSoftDelete: () =>
            setCount((prev) => (prev == null ? prev : Math.max(0, prev - 1))),
          onRestore: () => setCount((prev) => (prev == null ? prev : prev + 1)),
        });
      });
    };

    let idleId: number | null = null;
    let timeoutId: number | null = null;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(start, 0);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
      unsubscribeRegisteredUserCount(channel);
    };
  }, []);

  if (count == null) return null;

  return (
    <div
      className="rx-h2__user-count"
      data-registered-user-counter="v1"
      aria-label={`${count.toLocaleString("en-GB")} registered accounts`}
    >
      <span className="rx-h2__user-count-icon" aria-hidden="true">
        👥
      </span>
      <span className="rx-h2__user-count-value">{formatRegisteredUserCount(count)}</span>
    </div>
  );
}
