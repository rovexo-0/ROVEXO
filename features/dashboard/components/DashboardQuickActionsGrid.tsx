import Link from "next/link";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { MobileNavIcon } from "@/features/mobile-ui/components/MobileNavIcon";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/product-detail/icons";

export type QuickActionItem = {
  href: string;
  emoji: string;
  label: string;
  subtitle?: string;
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
    <section aria-labelledby="dashboard-quick-actions-heading" className="flex flex-col gap-ds-3">
      <h2 id="dashboard-quick-actions-heading" className="mhub-section__title lg:text-base lg:font-semibold">
        {title}
      </h2>

      <div className="mhub-grid lg:grid lg:grid-cols-2 lg:gap-ds-3">
        {actions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className={cn("mhub-card lg:hidden", focusRing)}
            aria-label={action.label}
          >
            <div className="mhub-card__top">
              <MobileNavIcon>
                <span className="mhub-icon__emoji" aria-hidden>
                  {action.emoji}
                </span>
              </MobileNavIcon>
              <ChevronRightIcon className="mhub-card__chevron h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="mhub-card__title">{action.label}</p>
              {action.subtitle ? (
                <p className="mhub-card__subtitle">{action.subtitle}</p>
              ) : null}
            </div>
          </Link>
        ))}
        {actions.map((action) => (
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
                <span className="text-lg leading-none" aria-hidden>
                  {action.emoji}
                </span>
              </PremiumIcon>
              <span className="text-sm font-semibold text-text-primary">{action.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
