"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AccountSellerLevelBadge } from "@/features/account-center/components/AccountSellerLevelBadge";
import type { AccountSellerPerformanceSummary } from "@/lib/account-center/seller-performance-summary";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type AccountSellerPerformanceCardProps = {
  performance: AccountSellerPerformanceSummary;
};

/** Compact seller performance summary — opens frozen dashboard at /seller/performance. */
export function AccountSellerPerformanceCard({ performance }: AccountSellerPerformanceCardProps) {
  const router = useRouter();
  const noSales = performance.totalSales === 0;

  const openPerformanceDashboard = useCallback(() => {
    router.push("/seller/performance");
  }, [router]);

  return (
    <section
      className="ac-v1__seller-card"
      aria-label="Seller Performance"
      data-ac-seller-performance="v1.0-compact"
    >
      <div className="ac-v1__seller-card-head">
        <h2 className="ac-v1__seller-card-title">Seller Performance</h2>
        <button
          type="button"
          onClick={openPerformanceDashboard}
          className={cn("ac-v1__seller-link", focusRing)}
          aria-label="View seller performance details"
        >
          View Details →
          <ChevronRight className="ac-v1__seller-chevron" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {noSales ? (
        <p className="ac-v1__seller-empty" role="status">
          Complete your first sale to unlock your performance score.
        </p>
      ) : null}

      <div className="ac-v1__seller-metrics">
        <div className="ac-v1__seller-metric">
          <span className="ac-v1__seller-metric-label">Seller Level</span>
          <AccountSellerLevelBadge level={performance.level} />
        </div>
        <div className="ac-v1__seller-metric">
          <span className="ac-v1__seller-metric-label">Rating</span>
          <span className="ac-v1__seller-metric-value">{performance.ratingDisplay}</span>
        </div>
        <div className="ac-v1__seller-metric">
          <span className="ac-v1__seller-metric-label">Completed Sales</span>
          <span className="ac-v1__seller-metric-value">
            {performance.totalSales.toLocaleString()}
          </span>
        </div>
        <div className="ac-v1__seller-metric">
          <span className="ac-v1__seller-metric-label">Response Rate</span>
          <span className="ac-v1__seller-metric-value">
            {Math.round(performance.responseRatePercent)}%
          </span>
        </div>
      </div>
    </section>
  );
}
