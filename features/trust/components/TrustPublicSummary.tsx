import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TrustScoreMeter } from "@/features/trust/components/TrustScoreMeter";
import { TrustTierBadge } from "@/features/trust/components/TrustTierBadge";
import type { PublicTrustSummary } from "@/lib/trust/types";

type TrustPublicSummaryProps = {
  summary: PublicTrustSummary;
  compact?: boolean;
};

export function TrustPublicSummary({ summary, compact = false }: TrustPublicSummaryProps) {
  return (
    <Card padding={compact ? "md" : "lg"} className="shadow-ds-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Trust Score</p>
          <div className="mt-2 flex items-center gap-2">
            <TrustTierBadge tier={summary.tier} />
            {summary.isLowTrust && <Badge variant="warning">Review carefully</Badge>}
          </div>
        </div>
        <p className="text-3xl font-bold text-primary">{summary.score}</p>
      </div>

      {!compact && (
        <>
          <TrustScoreMeter score={summary.score} tier={summary.tier} showLabel={false} className="mt-4" />

          {summary.trustReasons.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-text-secondary">
              {summary.trustReasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          )}

          {summary.warnings.length > 0 && (
            <div className="mt-4 rounded-ds-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              {summary.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-muted">Completed sales</dt>
              <dd className="font-semibold text-text-primary">{summary.completedSales}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Account age</dt>
              <dd className="font-semibold text-text-primary">{summary.accountAgeDays} days</dd>
            </div>
            {summary.responseRate != null && (
              <div>
                <dt className="text-text-muted">Response rate</dt>
                <dd className="font-semibold text-text-primary">{summary.responseRate}%</dd>
              </div>
            )}
            {summary.shippingReliability != null && (
              <div>
                <dt className="text-text-muted">Shipping reliability</dt>
                <dd className="font-semibold text-text-primary">{summary.shippingReliability}%</dd>
              </div>
            )}
          </dl>

          {summary.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.badges.map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
