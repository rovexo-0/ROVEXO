"use client";

import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import type { AnalyticsRecentActivity } from "@/lib/analytics/types";

type AnalyticsRecentActivitySectionProps = {
  activity: AnalyticsRecentActivity;
};

function ActivityCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm" className="flex min-h-[88px] flex-col justify-center gap-ds-1 shadow-ds-soft">
      <span className="text-lg font-bold tabular-nums text-text-primary">
        <AnimatedCounter value={value} />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </Card>
  );
}

export function AnalyticsRecentActivitySection({ activity }: AnalyticsRecentActivitySectionProps) {
  return (
    <section aria-labelledby="analytics-recent-activity-heading" className="flex flex-col gap-ds-3">
      <h2 id="analytics-recent-activity-heading" className="text-base font-semibold text-text-primary">
        Recent Activity
      </h2>

      <div className="grid grid-cols-3 gap-ds-3">
        <ActivityCard label="New Followers" value={activity.followers} />
        <ActivityCard label="New Reviews" value={activity.reviews} />
        <ActivityCard label="New Saves" value={activity.saves} />
      </div>
    </section>
  );
}
