import { cookies } from "next/headers";
import type { Ga4EventName, Ga4EventParams } from "@/lib/analytics/ga4-events";
import { GA_QUEUED_EVENTS_COOKIE } from "@/lib/analytics/ga4-config";

export type QueuedGaEvent = {
  name: Ga4EventName;
  params?: Ga4EventParams;
};

export async function queueGaEvents(events: QueuedGaEvent[]): Promise<void> {
  if (!events.length) return;

  const cookieStore = await cookies();
  cookieStore.set(GA_QUEUED_EVENTS_COOKIE, JSON.stringify(events), {
    maxAge: 120,
    path: "/",
    sameSite: "lax",
  });
}
