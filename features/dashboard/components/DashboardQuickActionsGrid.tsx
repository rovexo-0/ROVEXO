import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export type QuickActionItem = {
  href: string;
  emoji: string;
  label: string;
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
      <h2 id="dashboard-quick-actions-heading" className="text-base font-semibold text-text-primary">
        {title}
      </h2>

      <div className="grid grid-cols-2 gap-ds-3">
        {actions.map((action) => (
          <Link key={action.href + action.label} href={action.href} className="block">
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
