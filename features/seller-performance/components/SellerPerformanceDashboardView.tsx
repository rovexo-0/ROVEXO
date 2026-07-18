import { AccountCanonicalShell } from "@/features/account-canonical";
import { SellerLevelBadge } from "@/features/seller-performance/components/SellerLevelBadge";
import { SellerPerformanceHistorySection } from "@/features/seller-performance/components/SellerPerformanceHistorySection";
import {
  ACHIEVEMENT_DEFINITIONS,
  SELLER_LEVEL_LABELS,
} from "@/lib/seller-performance/master-spec";
import type { ScoreHistoryRange, SellerPerformanceDashboard } from "@/lib/seller-performance/types";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type SellerPerformanceDashboardViewProps = {
  data: SellerPerformanceDashboard;
  historyRange?: ScoreHistoryRange;
};

function badgeLabel(badgeId: (typeof ACHIEVEMENT_DEFINITIONS)[number]["id"]): string {
  return ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === badgeId)?.label ?? badgeId;
}

/** Selling → Performance — My Account Master Menu density. */
export function SellerPerformanceDashboardView({
  data,
  historyRange = "90d",
}: SellerPerformanceDashboardViewProps) {
  const publicBadges = data.score.badgesGranted.map((badgeId) => ({
    id: badgeId,
    label: badgeLabel(badgeId),
  }));

  return (
    <AccountCanonicalShell
      title="Performance"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      intro="Score from real selling activity."
    >
      <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5" data-seller-performance="v2.0-standard">
        <CanonicalSection title="Score">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Level"
              value={SELLER_LEVEL_LABELS[data.score.level]}
              trailing={<SellerLevelBadge level={data.score.level} />}
              showChevron={false}
            />
            <CanonicalMenuRow title="Score" value={String(data.score.score)} showChevron={false} />
            {data.progress.nextLevel ? (
              <CanonicalMenuRow
                title="Next level"
                description={
                  data.progress.pointsToNext != null
                    ? `${data.progress.pointsToNext} points to go`
                    : undefined
                }
                value={SELLER_LEVEL_LABELS[data.progress.nextLevel]}
                showChevron={false}
              />
            ) : null}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Factors">
          <CanonicalCard variant="list">
            {data.factorBreakdown.length ? (
              data.factorBreakdown.map((factor) => (
                <CanonicalMenuRow
                  key={factor.key}
                  title={factor.label}
                  description={factor.currentValue}
                  value={String(factor.componentScore)}
                  showChevron={false}
                />
              ))
            ) : (
              <CanonicalMenuRow title="No activity yet" showChevron={false} />
            )}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Changes">
          <CanonicalCard variant="list">
            {data.latestChanges.length ? (
              data.latestChanges.slice(0, 8).map((change) => (
                <CanonicalMenuRow
                  key={change.id}
                  title={change.reason}
                  value={`${change.delta >= 0 ? "+" : ""}${change.delta}`}
                  showChevron={false}
                />
              ))
            ) : (
              <CanonicalMenuRow title="No changes yet" showChevron={false} />
            )}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Achievements">
          <CanonicalCard variant="list">
            {data.achievements.map((achievement) => (
              <CanonicalMenuRow
                key={achievement.id}
                title={achievement.label}
                description={achievement.earned ? "Earned" : "Locked"}
                showChevron={false}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>

        {publicBadges.length > 0 ? (
          <CanonicalSection title="Badges">
            <CanonicalCard variant="list">
              {publicBadges.map((badge) => (
                <CanonicalMenuRow key={badge.id} title={badge.label} showChevron={false} />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        <CanonicalSection title="Trend">
          <SellerPerformanceHistorySection
            initialRange={historyRange}
            initialPoints={data.scoreHistory}
          />
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
