"use client";

import type { CommandCenterActivityEvent } from "@/lib/super-admin/command-center-v1/types";
import { LiveStatusBadge } from "@/features/super-admin/command-center-v1/components/LiveStatusBadge";

type ActivityFeedProps = {
  events: CommandCenterActivityEvent[];
};

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <section className="cc1-panel" aria-labelledby="cc1-activity-heading">
      <header className="cc1-panel__header">
        <h2 id="cc1-activity-heading" className="cc1-panel__title">
          Live Activity Feed
        </h2>
        <p className="cc1-panel__subtitle">Platform events in real time</p>
      </header>
      <ul className="cc1-feed">
        {events.length === 0 ? (
          <li className="cc1-feed__empty" role="status" aria-live="polite">
            <p className="cc1-feed__empty-title">No platform activity yet.</p>
            <p className="cc1-feed__empty-subtitle">Live events will appear automatically.</p>
            <LiveStatusBadge label="Collecting" variant="collecting" className="cc1-feed__empty-badge" />
          </li>
        ) : (
          events.map((event) => (
            <li key={event.id} className={`cc1-feed__item cc1-feed__item--${event.tone}`}>
              <div className="cc1-feed__meta">
                <span className="cc1-feed__type">{event.type}</span>
                <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleTimeString()}</time>
              </div>
              <p className="cc1-feed__message">{event.message}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
