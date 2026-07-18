import { Card } from "@/components/ui/Card";
import { TrustScoreMeter } from "@/features/trust/components/TrustScoreMeter";
import { TrustTierBadge } from "@/features/trust/components/TrustTierBadge";
import type { TrustDashboardData } from "@/lib/trust/types";

type SellerTrustDashboardProps = {
  data: TrustDashboardData;
};

export function SellerTrustDashboard({ data }: SellerTrustDashboardProps) {
  return (
    <div className="flex w-full flex-col gap-ds-4 pb-ds-5">
      <Card padding="lg" className="">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TrustTierBadge tier={data.score.tier} />
          {data.score.scoreLocked && (
            <p className="text-sm text-warning">Score locked: {data.score.lockReason}</p>
          )}
        </div>
        <TrustScoreMeter
          score={data.score.score}
          tier={data.score.tier}
          progressPercent={data.progress.percent}
          nextTier={data.progress.next}
          className="mt-4"
        />
      </Card>

      <div className="grid gap-ds-4 md:grid-cols-2">
        <Card padding="lg" className="">
          <h2 className="font-semibold text-text-primary">How to improve</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {data.recommendations.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>

        <Card padding="lg" className="">
          <h2 className="font-semibold text-text-primary">Recent changes</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {data.recentEvents.length ? (
              data.recentEvents.map((event) => (
                <li key={event.id} className="flex justify-between gap-3 border-b border-border pb-2">
                  <span>{event.reason ?? event.eventType.replace(/_/g, " ")}</span>
                  <span className={event.delta >= 0 ? "text-success" : "text-danger"}>
                    {event.delta >= 0 ? `+${event.delta}` : event.delta}
                  </span>
                </li>
              ))
            ) : (
              <li>No recent trust events yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card padding="lg" className="">
        <h2 className="font-semibold text-text-primary">Performance factors</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <Metric label="Completed sales" value={String(data.factors.completedSales)} />
          <Metric label="Completed purchases" value={String(data.factors.completedPurchases)} />
          <Metric label="Positive reviews" value={String(data.factors.positiveReviews)} />
          <Metric label="Negative reviews" value={String(data.factors.negativeReviews)} />
          <Metric label="On-time shipments" value={String(data.factors.onTimeShipments)} />
          <Metric label="Late shipments" value={String(data.factors.lateShipments)} />
          <Metric label="Response rate" value={`${data.factors.responseRate}%`} />
          <Metric label="Profile completion" value={`${data.factors.profileCompletion}%`} />
          <Metric label="Verifications" value={String(data.factors.verificationsApproved)} />
        </dl>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-text-primary">{value}</dd>
    </div>
  );
}
