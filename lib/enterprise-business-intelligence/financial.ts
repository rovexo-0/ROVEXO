import type { FinancialBreakdown, FinancialMetric } from "@/lib/enterprise-business-intelligence/types";
import { FINANCIAL_METRICS } from "@/lib/enterprise-business-intelligence/registry";

const LABELS: Record<FinancialMetric, string> = {
  revenue: "Total Revenue",
  "buyer-protection-fees": "Buyer Protection Fees",
  subscriptions: "Subscriptions",
  advertising: "Advertising",
  "featured-listings": "Featured Listings",
  promotions: "Promotions",
  refunds: "Refunds",
  chargebacks: "Chargebacks",
  "stripe-metrics": "Stripe Processing",
  "wallet-balance": "Wallet Balance",
};

export function isValidFinancialMetric(value: string): value is FinancialMetric {
  return (FINANCIAL_METRICS as readonly string[]).includes(value);
}

export function createDefaultFinancialBreakdown(): FinancialBreakdown[] {
  const amounts = [2847500, 142000, 89000, 156000, 98000, 67000, -42000, -8500, 2650000, 890000];
  return FINANCIAL_METRICS.map((metric, i) => ({
    metric,
    label: LABELS[metric],
    amount: amounts[i] ?? 0,
    changePercent: [8, 12, 5, 15, -3, 7, -2, 1, 9, 11][i] ?? 0,
  }));
}

export function totalRevenue(financial: FinancialBreakdown[]): number {
  return financial.find((f) => f.metric === "revenue")?.amount ?? 0;
}

export function netProfit(financial: FinancialBreakdown[]): number {
  const revenue = totalRevenue(financial);
  const refunds = Math.abs(financial.find((f) => f.metric === "refunds")?.amount ?? 0);
  const chargebacks = Math.abs(financial.find((f) => f.metric === "chargebacks")?.amount ?? 0);
  return revenue - refunds - chargebacks;
}
