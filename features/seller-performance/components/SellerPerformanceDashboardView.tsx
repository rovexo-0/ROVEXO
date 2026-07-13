import { Card } from "@/components/ui/Card";
import { SellerLevelBadge } from "@/features/seller-performance/components/SellerLevelBadge";
import { SellerPerformanceFactorCard } from "@/features/seller-performance/components/SellerPerformanceFactorCard";
import { SellerPerformanceHistorySection } from "@/features/seller-performance/components/SellerPerformanceHistorySection";
import { SellerPerformanceScoreMeter } from "@/features/seller-performance/components/SellerPerformanceScoreMeter";
import {
  ACHIEVEMENT_DEFINITIONS,
  SELLER_LEVEL_LABELS,
} from "@/lib/seller-performance/master-spec";
import type { ScoreHistoryRange, SellerPerformanceDashboard } from "@/lib/seller-performance/types";

type SellerPerformanceDashboardViewProps = {
  data: SellerPerformanceDashboard;
  historyRange?: ScoreHistoryRange;
};

function badgeLabel(badgeId: (typeof ACHIEVEMENT_DEFINITIONS)[number]["id"]): string {
  return ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === badgeId)?.label ?? badgeId;
}

export function SellerPerformanceDashboardView({
  data,
  historyRange = "90d",
}: SellerPerformanceDashboardViewProps) {
  const publicBadges = data.score.badgesGranted.map((badgeId) => ({
    id: badgeId,
    label: badgeLabel(badgeId),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-ds-6 px-ds-4 py-ds-6" data-seller-performance-dashboard="v1.0-frozen">
      <section>
        <p className="text-sm font-medium text-primary">Seller Performance</p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary">Your Reputation Engine</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Deterministic score from real marketplace activity. Read-only — updated automatically.
        </p>
      </section>

      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SellerLevelBadge level={data.score.level} />
          <p className="text-xs text-text-muted">
            Last updated{" "}
            {data.score.lastRecalculatedAt
              ? new Date(data.score.lastRecalculatedAt).toLocaleString()
              : "Pending first event"}
          </p>
        </div>
        <SellerPerformanceScoreMeter
          score={data.score.score}
          level={data.score.level}
          progressPercent={data.progress.percent}
          nextLevel={data.progress.nextLevel}
          className="mt-4"
        />
        {data.progress.nextLevel && data.progress.pointsToNext != null && (
          <div className="mt-4 rounded-ds-lg bg-secondary/60 p-ds-3 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">
              Next level: {SELLER_LEVEL_LABELS[data.progress.nextLevel]}
            </p>
            <p className="mt-1">You need {data.progress.pointsToNext} points</p>
            <ul className="mt-2 space-y-1">
              {data.progress.requirements.slice(1, 4).map((requirement) => (
                <li key={`${requirement.kind}-${requirement.label}`}>
                  or {requirement.remaining} more {requirement.label.toLowerCase()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid gap-ds-4 md:grid-cols-2">
        <Card padding="lg">
          <h2 className="font-semibold text-text-primary">Latest changes</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {data.latestChanges.length ? (
              data.latestChanges.map((change) => (
                <li key={change.id} className="flex justify-between gap-3 border-b border-border pb-2">
                  <span>
                    {change.delta >= 0 ? "+" : ""}
                    {change.delta} {change.reason}
                  </span>
                  <span className="text-text-muted">
                    {new Date(change.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))
            ) : (
              <li>No score changes yet.</li>
            )}
          </ul>
        </Card>

        <Card padding="lg">
          <h2 className="font-semibold text-text-primary">Achievements</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.achievements.map((achievement) => (
              <li
                key={achievement.id}
                className={
                  achievement.earned
                    ? "rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    : "rounded-ds-full bg-secondary px-3 py-1 text-xs text-text-muted"
                }
                title={achievement.description}
              >
                {achievement.label}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 md:grid-cols-2">
        <Card padding="lg">
          <h2 className="font-semibold text-text-primary">Public badges</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {publicBadges.length ? (
              publicBadges.map((badge) => (
                <li
                  key={badge.id}
                  className="rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {badge.label}
                </li>
              ))
            ) : (
              <li className="text-sm text-text-secondary">No public badges yet.</li>
            )}
          </ul>
        </Card>

        <Card padding="lg">
          <h2 className="font-semibold text-text-primary">Notifications</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {data.latestChanges.length ? (
              data.latestChanges.slice(0, 6).map((change) => (
                <li key={`notice-${change.id}`} className="border-b border-border pb-2">
                  Reputation update: {change.delta >= 0 ? "+" : ""}
                  {change.delta} points — {change.reason}
                </li>
              ))
            ) : (
              <li>No reputation notifications yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card padding="lg">
        <h2 className="font-semibold text-text-primary">Score trend</h2>
        <SellerPerformanceHistorySection
          initialRange={historyRange}
          initialPoints={data.scoreHistory}
        />
      </Card>

      <Card padding="lg">
        <h2 className="font-semibold text-text-primary">Performance factors</h2>
        {data.factorBreakdown.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.factorBreakdown.map((factor) => (
              <SellerPerformanceFactorCard key={factor.key} factor={factor} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            Factor breakdown will appear after your first marketplace activity is recorded.
          </p>
        )}
      </Card>
    </div>
  );
}
