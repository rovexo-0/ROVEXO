"use client";

import type { LiveEventItem } from "@/lib/analytics/live-center/types";

const EVENT_ICONS: Record<LiveEventItem["type"], string> = {
  visitor_joined: "🟢",
  seller_registered: "🟢",
  listing_published: "🟢",
  order_created: "🟢",
  payment_completed: "🟢",
  refund_created: "🟢",
  user_signed_in: "🟢",
  user_signed_out: "🟢",
};

type LiveEventFeedProps = {
  events: LiveEventItem[];
};

export function LiveEventFeed({ events }: LiveEventFeedProps) {
  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <header className="mb-ds-3">
        <h3 className="text-sm font-semibold text-text-primary">⚡ Live Event Feed</h3>
        <p className="mt-ds-1 text-xs text-text-secondary">Realtime platform activity</p>
      </header>

      {events.length === 0 ? (
        <p className="py-ds-4 text-center text-sm text-text-secondary">No recent events</p>
      ) : (
        <ul className="live-analytics-scroll max-h-96 space-y-ds-2 overflow-y-auto" aria-live="polite">
          {events.map((event) => (
            <li
              key={event.id}
              className="live-analytics-fade-in rounded-ds-lg border border-border/60 bg-white/70 px-ds-3 py-ds-3"
            >
              <div className="flex items-start justify-between gap-ds-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {EVENT_ICONS[event.type]} {event.title}
                  </p>
                  {event.subtitle ? (
                    <p className="mt-ds-1 truncate text-xs text-text-secondary">{event.subtitle}</p>
                  ) : null}
                  {event.countryName ? (
                    <p className="mt-ds-1 text-xs text-text-muted">
                      {event.flag} {event.countryName}
                      {event.browser ? ` · ${event.browser}` : ""}
                      {event.operatingSystem ? ` · ${event.operatingSystem}` : ""}
                    </p>
                  ) : null}
                </div>
                <time className="shrink-0 text-xs tabular-nums text-text-muted">
                  {new Date(event.timestamp).toLocaleTimeString("en-GB")}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
