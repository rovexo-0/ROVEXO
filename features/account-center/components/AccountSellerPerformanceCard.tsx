import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { SellerLevelBadge } from "@/features/seller-performance/components/SellerLevelBadge";
import { AccountSellerPerformanceIcon } from "@/features/account-center/components/AccountSellerPerformanceIcon";
import { AccountSellerScoreRing } from "@/features/account-center/components/AccountSellerScoreRing";
import { AccountSellerStarRating } from "@/features/account-center/components/AccountSellerStarRating";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type AccountSellerPerformanceCardProps = {
  performance: AccountSellerPerformanceSummary;
};

export function AccountSellerPerformanceCard({ performance }: AccountSellerPerformanceCardProps) {
  return (
    <section
      className="ac-canonical__seller-performance"
      aria-label="Seller Performance"
      data-ac-seller-performance="v1.0"
    >
      <div className="ac-canonical__seller-performance-header">
        <div className="ac-canonical__seller-performance-heading">
          <AccountSellerPerformanceIcon className="ac-canonical__seller-performance-icon" />
          <h2 className="ac-canonical__seller-performance-title">Seller Performance</h2>
        </div>
        <Link
          href="/seller/performance"
          className={cn("ac-canonical__seller-performance-link", focusRing)}
        >
          View details
          <ChevronRightLineIcon className="ac-canonical__seller-performance-link-icon" />
        </Link>
      </div>

      <div className="ac-canonical__seller-performance-grid">
        <div className="ac-canonical__seller-performance-col ac-canonical__seller-performance-col--level">
          <SellerLevelBadge level={performance.level} className="ac-canonical__seller-level-badge" />
          {performance.reviewCount === 0 ? (
            <p className="ac-canonical__seller-rating-new">⭐ New</p>
          ) : (
            <AccountSellerStarRating rating={performance.averageRating} />
          )}
        </div>

        <div className="ac-canonical__seller-performance-col ac-canonical__seller-performance-col--score">
          <AccountSellerScoreRing score={performance.score} />
        </div>

        <div className="ac-canonical__seller-performance-col ac-canonical__seller-performance-col--sales">
          <p className="ac-canonical__seller-metric-label">Completed Sales</p>
          <p className="ac-canonical__seller-metric-value">
            {performance.totalSales.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="ac-canonical__seller-progress-message">{performance.progressMessage}</p>

      <div className="ac-canonical__seller-progress-bar-row">
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
        <span className="ac-canonical__seller-progress-percent">{performance.progressPercent}%</span>
      </div>
    </section>
  );
}
