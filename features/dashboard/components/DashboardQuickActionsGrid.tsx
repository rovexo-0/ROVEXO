import Link from "next/link";
import { DashboardIcon3D, resolveDashboardIconType, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { Card } from "@/components/ui/Card";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { DashboardGrid } from "@/features/dashboard/components/DashboardGrid";
import { DashboardSection } from "@/features/dashboard/components/DashboardSection";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/product-detail/icons";

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

export function DashboardQuickActionsGrid({
  title = "Quick Actions",
  actions,
}: DashboardQuickActionsGridProps) {
  return (
    <DashboardSection id="dash-quick-actions" title={title}>
      <DashboardGrid className="lg:grid lg:grid-cols-2 lg:gap-ds-3">
        {actions.map((action) => {
          const iconType = action.iconType ?? resolveDashboardIconType(action.href);
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn("rx-dash-tile lg:hidden", focusRing)}
              aria-label={action.label}
            >
              <div className="rx-dash-tile__top">
                <div className="rx-dash-tile__icon">
                  <DashboardIcon3D type={iconType} size={32} />
                </div>
                <ChevronRightIcon className="rx-dash-tile__chevron h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="rx-dash-tile__title">{action.label}</p>
                {action.subtitle ? (
                  <p className="rx-dash-tile__subtitle">{action.subtitle}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
        {actions.map((action) => {
          const iconType = action.iconType ?? resolveDashboardIconType(action.href);
          return (
            <Link key={`desktop-${action.href}`} href={action.href} className="hidden lg:block">
              <Card
                padding="md"
                interactive
                className={cn(
                  "flex min-h-[92px] flex-col items-start justify-center gap-ds-2",
                  transitionFast,
                  focusRing,
                )}
              >
                <PremiumIcon size="sm" float label={action.label}>
                  <DashboardIcon3D type={iconType} size={24} />
                </PremiumIcon>
                <span className="text-sm font-semibold text-text-primary">{action.label}</span>
              </Card>
            </Link>
          );
        })}
      </DashboardGrid>
    </DashboardSection>
  );
}
