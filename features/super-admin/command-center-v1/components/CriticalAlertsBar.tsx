"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { NocCriticalAlert } from "@/lib/super-admin/noc-v1/types";

type CriticalAlertsBarProps = {
  alerts: NocCriticalAlert[];
};

export function CriticalAlertsBar({ alerts }: CriticalAlertsBarProps) {
  if (alerts.length === 0) {
    return (
      <section className="cc1-noc-alerts cc1-noc-alerts--clear" aria-label="Critical alert center">
        <p className="cc1-noc-alerts__clear">All systems operational — no critical alerts</p>
      </section>
    );
  }

  return (
    <section className="cc1-noc-alerts" aria-label="Critical alert center">
      <header className="cc1-noc-alerts__header">
        <h2 className="cc1-noc-alerts__title">Critical Alert Center</h2>
        <span className="cc1-noc-alerts__count">{alerts.length} active</span>
      </header>
      <ul className="cc1-noc-alerts__list">
        {alerts.map((alert) => {
          const item = (
            <div
              className={cn(
                "cc1-noc-alerts__item",
                alert.severity === "critical" ? "cc1-noc-alerts__item--critical" : "cc1-noc-alerts__item--warning",
              )}
            >
              <p className="cc1-noc-alerts__item-title">{alert.title}</p>
              <p className="cc1-noc-alerts__item-message">{alert.message}</p>
            </div>
          );

          return (
            <li key={alert.id}>
              {alert.href ? (
                <Link href={alert.href} className="cc1-noc-alerts__link">
                  {item}
                </Link>
              ) : (
                item
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
