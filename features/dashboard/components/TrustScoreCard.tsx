import Link from "next/link";
import type { TrustDashboardData } from "@/lib/trust/types";

type TrustScoreCardProps = {
  trustData: TrustDashboardData;
};

export function TrustScoreCard({ trustData }: TrustScoreCardProps) {
  const fill = Math.max(0, Math.min(100, trustData.score.score));

  return (
    <section className="dash-v1-section" aria-labelledby="dash-trust-heading">
      <h2 id="dash-trust-heading" className="dash-v1-section__title">
        Trust Score
      </h2>
      <Link href="/trust" className="dash-v1-trust-card block" aria-label="View Trust Centre">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-text-primary">{trustData.score.score}</p>
            <p className="mt-0.5 text-sm capitalize text-text-secondary">{trustData.score.tier} trust</p>
          </div>
          {trustData.progress.next ? (
            <p className="text-right text-xs text-text-muted">
              {trustData.progress.percent}% to {trustData.progress.next}
            </p>
          ) : null}
        </div>
        <div
          className="dash-v1-trust-meter mt-3"
          role="progressbar"
          aria-valuenow={trustData.score.score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="dash-v1-trust-meter__fill" style={{ width: `${fill}%` }} />
        </div>
      </Link>
    </section>
  );
}
