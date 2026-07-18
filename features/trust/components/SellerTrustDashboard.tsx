import { TrustScoreMeter } from "@/features/trust/components/TrustScoreMeter";
import { TrustTierBadge } from "@/features/trust/components/TrustTierBadge";
import type { TrustDashboardData } from "@/lib/trust/types";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type SellerTrustDashboardProps = {
  data: TrustDashboardData;
};

export function SellerTrustDashboard({ data }: SellerTrustDashboardProps) {
  return (
    <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
      <CanonicalSection title="Trust score">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-3 p-ds-4">
          <div className="flex flex-wrap items-center justify-between gap-ds-2">
            <TrustTierBadge tier={data.score.tier} />
            {data.score.scoreLocked ? (
              <p className="text-sm text-warning">Score locked: {data.score.lockReason}</p>
            ) : null}
          </div>
          <TrustScoreMeter
            score={data.score.score}
            tier={data.score.tier}
            progressPercent={data.progress.percent}
            nextTier={data.progress.next}
          />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="How to improve">
        <CanonicalCard variant="list">
          {data.recommendations.map((item) => (
            <CanonicalMenuRow key={item} title={item} showChevron={false} />
          ))}
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Recent changes">
        <CanonicalCard variant="list">
          {data.recentEvents.length ? (
            data.recentEvents.map((event) => (
              <CanonicalMenuRow
                key={event.id}
                title={event.reason ?? event.eventType.replace(/_/g, " ")}
                value={event.delta >= 0 ? `+${event.delta}` : String(event.delta)}
                showChevron={false}
              />
            ))
          ) : (
            <CanonicalMenuRow title="No recent trust events yet." showChevron={false} hideChevron />
          )}
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Performance factors">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Completed sales"
            value={String(data.factors.completedSales)}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Completed purchases"
            value={String(data.factors.completedPurchases)}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Positive reviews"
            value={String(data.factors.positiveReviews)}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Negative reviews"
            value={String(data.factors.negativeReviews)}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="On-time shipments"
            value={String(data.factors.onTimeShipments)}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Late shipments"
            value={String(data.factors.lateShipments)}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Response rate"
            value={`${data.factors.responseRate}%`}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Profile completion"
            value={`${data.factors.profileCompletion}%`}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Verifications"
            value={String(data.factors.verificationsApproved)}
            showChevron={false}
          />
        </CanonicalCard>
      </CanonicalSection>
    </div>
  );
}
