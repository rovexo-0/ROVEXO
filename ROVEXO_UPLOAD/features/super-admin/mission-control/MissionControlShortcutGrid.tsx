"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MissionControlModule } from "@/lib/super-admin/mission-control/types";

type MissionControlShortcutGridProps = {
  modules: MissionControlModule[];
  limit?: number;
};

export function MissionControlShortcutGrid({ modules, limit }: MissionControlShortcutGridProps) {
  const items = limit ? modules.slice(0, limit) : modules;

  return (
    <div className="mc-shortcut-grid">
      {items.map((module) => (
        <Link
          key={module.id}
          href={module.href}
          className={cn("mc-shortcut-card", focusRing)}
        >
          <span className="mc-shortcut-card__icon" aria-hidden>
            {module.icon}
          </span>
          <span className="mc-shortcut-card__body">
            <span className="mc-shortcut-card__title">{module.label}</span>
            <span className="mc-shortcut-card__desc">{module.description}</span>
          </span>
          {module.badge ? <span className="mc-shortcut-card__badge">+{module.badge}</span> : null}
        </Link>
      ))}
    </div>
  );
}
