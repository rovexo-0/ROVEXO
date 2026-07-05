"use client";

import Link from "next/link";
import type { CommandCenterQuickAction } from "@/lib/super-admin/command-center-v1/types";

type QuickActionsGridProps = {
  actions: CommandCenterQuickAction[];
};

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <section className="cc1-panel" aria-labelledby="cc1-actions-heading">
      <header className="cc1-panel__header">
        <h2 id="cc1-actions-heading" className="cc1-panel__title">
          Quick Actions
        </h2>
        <p className="cc1-panel__subtitle">Jump to operational controls</p>
      </header>
      <div className="cc1-actions-grid">
        {actions.map((action) => (
          <Link key={action.id} href={action.href} className="cc1-action">
            <span className="cc1-action__icon" aria-hidden>
              {action.icon}
            </span>
            <span className="cc1-action__label">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
