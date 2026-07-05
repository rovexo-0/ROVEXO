import type { TrustDashboardData } from "@/lib/trust/types";

type StatisticsRowProps = {
  factors: TrustDashboardData["factors"];
};

type Stat = { id: string; value: string; label: string };

function buildStats(factors: TrustDashboardData["factors"]): Stat[] {
  const reviews = factors.positiveReviews + factors.negativeReviews;
  const positive = reviews > 0 ? `${Math.round((factors.positiveReviews / reviews) * 100)}%` : "100%";
  const response = factors.responseRate > 0 ? `${Math.round(factors.responseRate)}%` : "—";
  const orders = factors.completedSales > 0 ? String(factors.completedSales) : "0";
  const cases = factors.disputesWon > 0 ? String(factors.disputesWon) : "0";

  return [
    { id: "feedback", value: positive, label: "Positive Feedback" },
    { id: "response", value: response, label: "Avg Response" },
    { id: "orders", value: orders, label: "Completed Orders" },
    { id: "cases", value: cases, label: "Resolved Cases" },
  ];
}

/** Four equal-width statistic columns separated by centered vertical dividers. */
export function StatisticsRow({ factors }: StatisticsRowProps) {
  const stats = buildStats(factors);

  return (
    <div className="acx-stats" role="group" aria-label="Performance statistics">
      {stats.map((stat, index) => (
        <div key={stat.id} className="acx-stats__col" data-divider={index > 0 ? "true" : undefined}>
          <p className="acx-stats__value">{stat.value}</p>
          <p className="acx-stats__label">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
