import { AccountIcon } from "@/components/account/AccountIcons";
import type { TrustDashboardData } from "@/lib/trust/types";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type SellerTrustDashboardProps = {
  data: TrustDashboardData;
};

/**
 * Seller Trust — One Product freeze.
 * Same Master Menu rows as Trust Centre. No score-meter hero.
 */
export function SellerTrustDashboard({ data }: SellerTrustDashboardProps) {
  return (
    <div className="ac-canonical flex w-full flex-col gap-ds-4 pb-ds-5">
      <CanonicalSection title="Score">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Trust Score"
            description={data.score.tier}
            value={String(data.score.score)}
            showChevron={false}
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="verification" />
              </span>
            }
          />
          {data.score.scoreLocked ? (
            <CanonicalMenuRow
              title="Score locked"
              description={data.score.lockReason ?? undefined}
              showChevron={false}
            />
          ) : null}
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="How to improve">
        <CanonicalCard variant="list">
          {data.recommendations.length ? (
            data.recommendations.map((item) => (
              <CanonicalMenuRow key={item} title={item} showChevron={false} />
            ))
          ) : (
            <CanonicalMenuRow title="No recommendations right now." showChevron={false} />
          )}
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
            <CanonicalMenuRow title="No recent trust events yet." showChevron={false} />
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
