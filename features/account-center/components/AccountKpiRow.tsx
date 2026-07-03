import { PremiumAccountIcon } from "@/components/icons/PremiumAccountIcon";
import type { AccountPremiumIconKey } from "@/lib/account-center/premium-icons";
import type { TrustDashboardData } from "@/lib/trust/types";

type AccountKpiRowProps = {
  trustData: TrustDashboardData;
};

type Kpi = {
  id: string;
  icon: AccountPremiumIconKey;
  value: string;
  label: string;
};

function buildKpis(factors: TrustDashboardData["factors"]): Kpi[] {
  const reviews = factors.positiveReviews + factors.negativeReviews;
  const positive = reviews > 0 ? `${Math.round((factors.positiveReviews / reviews) * 100)}%` : "100%";
  const response = factors.responseRate > 0 ? `${Math.round(factors.responseRate)}%` : "—";
  const orders = factors.completedSales > 0 ? String(factors.completedSales) : "0";
  const cases = factors.disputesWon > 0 ? String(factors.disputesWon) : "0";

  return [
    { id: "feedback", icon: "feedback", value: positive, label: "Positive Feedback" },
    { id: "response", icon: "response", value: response, label: "Avg Response" },
    { id: "orders", icon: "orders", value: orders, label: "Completed Orders" },
    { id: "cases", icon: "cases", value: cases, label: "Resolved Cases" },
  ];
}

export function AccountKpiRow({ trustData }: AccountKpiRowProps) {
  const kpis = buildKpis(trustData.factors);

  return (
    <section className="ac2-kpis" aria-label="Performance metrics">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="ac2-kpi">
          <span className="ac2-kpi__icon">
            <PremiumAccountIcon icon={kpi.icon} size={24} />
          </span>
          <p className="ac2-kpi__value">{kpi.value}</p>
          <p className="ac2-kpi__label">{kpi.label}</p>
        </div>
      ))}
    </section>
  );
}
