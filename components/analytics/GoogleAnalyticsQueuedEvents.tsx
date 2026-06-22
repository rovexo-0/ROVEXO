"use client";

import { useEffect } from "react";
import { GA_QUEUED_EVENTS_COOKIE } from "@/lib/analytics/ga4-config";
import { trackGaEvent, type Ga4EventName, type Ga4EventParams } from "@/lib/analytics/ga4-events";

type QueuedGaEvent = {
  name: Ga4EventName;
  params?: Ga4EventParams;
};

function readQueuedEvents(): QueuedGaEvent[] {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${GA_QUEUED_EVENTS_COOKIE}=`));

  if (!match) return [];

  try {
    const raw = decodeURIComponent(match.slice(GA_QUEUED_EVENTS_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as QueuedGaEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clearQueuedEventsCookie(): void {
  document.cookie = `${GA_QUEUED_EVENTS_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

export function GoogleAnalyticsQueuedEvents() {
  useEffect(() => {
    const events = readQueuedEvents();
    if (!events.length) return;

    for (const event of events) {
      trackGaEvent(event.name, event.params);
    }

    clearQueuedEventsCookie();
  }, []);

  return null;
}
