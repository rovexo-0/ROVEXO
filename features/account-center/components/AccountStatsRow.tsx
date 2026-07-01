import type { TrustDashboardData } from "@/lib/trust/types";

type AccountStatsRowProps = {
  trustData: TrustDashboardData;
};

function statValue(factors: TrustDashboardData["factors"], type: "positive" | "response" | "sales" | "disputes") {
  switch (type) {
    case "positive": {
      const total = factors.positiveReviews + factors.negativeReviews;
      if (total === 0) return "—";
      return `${Math.round((factors.positiveReviews / total) * 100)}%`;
    }
    case "response":
      return factors.responseRate > 0 ? `${Math.round(factors.responseRate)}%` : "—";
    case "sales":
      return factors.completedSales > 0 ? String(factors.completedSales) : "—";
    case "disputes":
      return factors.disputesWon > 0 ? String(factors.disputesWon) : "—";
  }
}

export function AccountStatsRow({ trustData }: AccountStatsRowProps) {
  const { factors } = trustData;

  return (
    <section className="account-center-stats" aria-label="Trust statistics">
      <div className="account-center-stats__item">
        <span className="account-center-stats__emoji" aria-hidden>
          😊
        </span>
        <p className="account-center-stats__value">{statValue(factors, "positive")}</p>
        <p className="account-center-stats__label">Positive Feedback</p>
      </div>
      <div className="account-center-stats__item">
        <span className="account-center-stats__emoji" aria-hidden>
          ⚡
        </span>
        <p className="account-center-stats__value">{statValue(factors, "response")}</p>
        <p className="account-center-stats__label">Avg Response</p>
      </div>
      <div className="account-center-stats__item">
        <span className="account-center-stats__emoji" aria-hidden>
          ✓
        </span>
        <p className="account-center-stats__value">{statValue(factors, "sales")}</p>
        <p className="account-center-stats__label">Completed Orders</p>
      </div>
      <div className="account-center-stats__item">
        <span className="account-center-stats__emoji" aria-hidden>
          🛡
        </span>
        <p className="account-center-stats__value">{statValue(factors, "disputes")}</p>
        <p className="account-center-stats__label">Resolved Cases</p>
      </div>
    </section>
  );
}
