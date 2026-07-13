import Link from "next/link";
import { SellerLevelBadge } from "@/features/seller-performance/components/SellerLevelBadge";
import { AccountSellerScoreRing } from "@/features/account-center/components/AccountSellerScoreRing";
import { formatSellerPerformanceRating } from "@/lib/account-center/format-profile-rating";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type AccountSellerPerformanceCardProps = {
  performance: AccountSellerPerformanceSummary;
};

export function AccountSellerPerformanceCard({ performance }: AccountSellerPerformanceCardProps) {
  const ratingLine = formatSellerPerformanceRating(
    performance.averageRating,
    performance.reviewCount,
  );

  return (
    <section
      className="ac-canonical__seller-performance"
      aria-label="Seller Performance"
      data-ac-seller-performance="v1.0"
    >
      <div className="ac-canonical__seller-performance-header">
        <h2 className="ac-canonical__seller-performance-title">Seller Performance</h2>
        <SellerLevelBadge level={performance.level} className="ac-canonical__seller-level-badge" />
      </div>

      <div className="ac-canonical__seller-performance-body">
        <AccountSellerScoreRing score={performance.score} />
        <div className="ac-canonical__seller-performance-metrics">
          <div>
            <p className="ac-canonical__seller-metric-label">Seller rating</p>
            <p className="ac-canonical__seller-metric-value">{ratingLine}</p>
          </div>
          <div>
            <p className="ac-canonical__seller-metric-label">Total sales</p>
            <p className="ac-canonical__seller-metric-value">
              {performance.totalSales.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="ac-canonical__seller-performance-progress">
        <div className="ac-canonical__seller-progress-row">
          <span className="ac-canonical__seller-progress-label">Level progress</span>
          <span className="ac-canonical__seller-progress-percent">{performance.progressPercent}%</span>
        </div>
        <div
          className="ac-canonical__seller-progress-track"
          role="progressbar"
          aria-valuenow={performance.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress to next seller level"
        >
          <div
            className="ac-canonical__seller-progress-fill"
            style={{ width: `${performance.progressPercent}%` }}
          />
        </div>
        <p className="ac-canonical__seller-progress-message">{performance.progressMessage}</p>
      </div>

      <Link
        href="/seller/performance"
        className={cn("ac-canonical__seller-performance-cta", focusRing)}
      >
        View details
      </Link>
    </section>
  );
}
