"use client";

import { cn } from "@/lib/cn";
import type { NocHealthCard, NocHealthStatus } from "@/lib/super-admin/noc-v1/types";

const STATUS_CLASS: Record<NocHealthStatus, string> = {
  healthy: "cc1-noc-health--healthy",
  warning: "cc1-noc-health--warning",
  critical: "cc1-noc-health--critical",
  maintenance: "cc1-noc-health--maintenance",
  offline: "cc1-noc-health--offline",
};

const STATUS_LABEL: Record<NocHealthStatus, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  maintenance: "Maintenance",
  offline: "Offline",
};

type HealthScoresPanelProps = {
  cards: NocHealthCard[];
};

export function HealthScoresPanel({ cards }: HealthScoresPanelProps) {
  return (
    <section className="cc1-noc-health" aria-labelledby="cc1-noc-health-title">
      <header className="cc1-noc-health__header">
        <div>
          <p className="cc1-noc-health__eyebrow">Live Platform Health</p>
          <h2 id="cc1-noc-health-title" className="cc1-noc-health__title">
            Network Operations Center
          </h2>
        </div>
      </header>
      <div className="cc1-noc-health__grid">
        {cards.map((card) => (
          <article
            key={card.id}
            className={cn("cc1-noc-health__card", STATUS_CLASS[card.status])}
            aria-label={`${card.label}: ${card.score} out of 100, ${STATUS_LABEL[card.status]}`}
          >
            <p className="cc1-noc-health__label">{card.label}</p>
            <p className="cc1-noc-health__score">{card.score}</p>
            <p className="cc1-noc-health__status">{STATUS_LABEL[card.status]}</p>
            {card.detail ? <p className="cc1-noc-health__detail">{card.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
