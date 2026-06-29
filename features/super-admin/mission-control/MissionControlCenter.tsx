import Link from "next/link";
import { MissionControlLiveCounters } from "@/features/super-admin/mission-control/MissionControlLiveCounters";
import { MissionControlServiceGrid } from "@/features/super-admin/mission-control/MissionControlServiceGrid";
import { MissionControlShortcutGrid } from "@/features/super-admin/mission-control/MissionControlShortcutGrid";
import { NotificationPriorityLegend } from "@/features/super-admin/mission-control/NotificationPriorityLegend";
import type { MissionControlSnapshot } from "@/lib/super-admin/mission-control/types";
import { cn } from "@/lib/cn";

type MissionControlCenterProps = {
  snapshot: MissionControlSnapshot;
};

const HEALTH_LABEL = {
  online: "All systems operational",
  warning: "Some services need attention",
  offline: "Critical services offline",
} as const;

export function MissionControlCenter({ snapshot }: MissionControlCenterProps) {
  const primaryModules = snapshot.modules.filter((module) =>
    [
      "homepage-builder",
      "theme-studio",
      "menu-builder",
      "listings",
      "orders",
      "shipping",
      "payments",
      "wallet",
      "users",
      "businesses",
      "categories",
      "banners",
      "premium-assets",
      "ai-manager",
      "features",
      "analytics",
      "reports",
      "support",
      "messages",
      "notifications",
      "security",
      "developer",
      "settings",
    ].includes(module.id),
  );

  return (
    <div className="mc-center">
      <section className="mc-section">
        <div className="mc-section__header">
          <div>
            <h2 className="mc-section__title">Platform shortcuts</h2>
            <p className="mc-section__desc">Every configurable module — one click away.</p>
          </div>
          <span className={cn("mc-platform-badge", `mc-platform-badge--${snapshot.platformHealth}`)}>
            {HEALTH_LABEL[snapshot.platformHealth]}
          </span>
        </div>
        <MissionControlShortcutGrid modules={primaryModules} />
      </section>

      <section className="mc-section">
        <div className="mc-section__header">
          <div>
            <h2 className="mc-section__title">Live platform status</h2>
            <p className="mc-section__desc">Real-time health across marketplace services.</p>
          </div>
          <Link href="/super-admin/monitoring" className="mc-section__link">
            Full diagnostics
          </Link>
        </div>
        <MissionControlServiceGrid services={snapshot.services} />
      </section>

      <section className="mc-section">
        <div className="mc-section__header">
          <div>
            <h2 className="mc-section__title">Live counters</h2>
            <p className="mc-section__desc">Activity deltas across the platform.</p>
          </div>
          <p className="mc-section__meta">Updated {new Date(snapshot.scannedAt).toLocaleTimeString()}</p>
        </div>
        <MissionControlLiveCounters counters={snapshot.counters} />
      </section>

      <section className="mc-section">
        <div className="mc-section__header">
          <div>
            <h2 className="mc-section__title">Notification priority</h2>
            <p className="mc-section__desc">Support filters by severity.</p>
          </div>
          <Link href="/super-admin/support" className="mc-section__link">
            Support queue
          </Link>
        </div>
        <NotificationPriorityLegend />
      </section>
    </div>
  );
}
