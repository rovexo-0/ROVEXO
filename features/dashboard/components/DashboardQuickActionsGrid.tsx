import type { DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { resolveDashboardIconType } from "@/lib/icons/resolve-dashboard-icon-type";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

export type QuickActionItem = {
  href: string;
  label: string;
  subtitle?: string;
  iconType?: DashboardIconType;
};

type DashboardQuickActionsGridProps = {
  title?: string;
  actions: QuickActionItem[];
};

/** Absolute Final: quick actions as Master Menu rows — no tile/PremiumIcon grid. */
export function DashboardQuickActionsGrid({
  title = "Quick Actions",
  actions,
}: DashboardQuickActionsGridProps) {
  return (
    <CanonicalSection title={title} titleId="dash-quick-actions">
      <CanonicalCard variant="list">
        {actions.map((action) => {
          const iconType = action.iconType ?? resolveDashboardIconType(action.href);
          return (
            <CanonicalMenuRow
              key={action.href + action.label}
              title={action.label}
              description={action.subtitle}
              href={action.href}
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <DashboardIcon3D type={iconType} size={20} />
                </span>
              }
            />
          );
        })}
      </CanonicalCard>
    </CanonicalSection>
  );
}
