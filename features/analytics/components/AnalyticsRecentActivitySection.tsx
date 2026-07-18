"use client";

import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import type { AnalyticsRecentActivity } from "@/lib/analytics/types";

type AnalyticsRecentActivitySectionProps = {
  activity: AnalyticsRecentActivity;
};

/** One Product — metrics as Master Menu rows, not dashboard cards. */
export function AnalyticsRecentActivitySection({ activity }: AnalyticsRecentActivitySectionProps) {
  return (
    <CanonicalSection title="Recent Activity">
      <CanonicalCard variant="list">
        <CanonicalMenuRow title="New Followers" value={String(activity.followers)} showChevron={false} />
        <CanonicalMenuRow title="New Reviews" value={String(activity.reviews)} showChevron={false} />
        <CanonicalMenuRow title="New Saves" value={String(activity.saves)} showChevron={false} />
      </CanonicalCard>
    </CanonicalSection>
  );
}
