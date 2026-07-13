import {
  SELLER_PERFORMANCE_WEIGHTS,
  type SellerPerformanceComponentKey,
} from "@/lib/seller-performance/master-spec";

export type FactorExplanation = {
  key: SellerPerformanceComponentKey;
  label: string;
  description: string;
  maxContributionPercent: number;
};

export const FACTOR_EXPLANATIONS: FactorExplanation[] = [
  {
    key: "reviews",
    label: "Reviews",
    description:
      "Average star rating and review volume from verified buyer reviews. Fraudulent reviews are excluded.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.reviews * 100,
  },
  {
    key: "completedOrders",
    label: "Completed Orders",
    description: "Count of successfully completed sales. Cancelled, refunded, and pending orders are excluded.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.completedOrders * 100,
  },
  {
    key: "responseRate",
    label: "Response Rate",
    description: "Percentage of buyer messages that received a seller reply.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.responseRate * 100,
  },
  {
    key: "averageResponseTime",
    label: "Average Response Time",
    description: "Average time between a buyer message and the seller's first reply. Faster is better.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.averageResponseTime * 100,
  },
  {
    key: "dispatchTime",
    label: "Dispatch Time",
    description: "Average time from payment confirmed to shipment confirmed.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.dispatchTime * 100,
  },
  {
    key: "cancellationRate",
    label: "Cancellation Rate",
    description: "Share of orders cancelled versus completed. Lower cancellation improves this factor.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.cancellationRate * 100,
  },
  {
    key: "validReports",
    label: "Valid Reports",
    description: "Validated reports upheld against the seller. Fewer validated reports means a higher score.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.validReports * 100,
  },
  {
    key: "profileCompletion",
    label: "Profile Completion",
    description: "Automatic checklist completion across profile, verification, and store policy fields.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.profileCompletion * 100,
  },
  {
    key: "storeActivity",
    label: "Store Activity",
    description: "Recent listings, logins, messages, sales, and profile updates in the last 30 days.",
    maxContributionPercent: SELLER_PERFORMANCE_WEIGHTS.storeActivity * 100,
  },
];

export function getFactorExplanation(key: SellerPerformanceComponentKey): FactorExplanation {
  return FACTOR_EXPLANATIONS.find((entry) => entry.key === key)!;
}
