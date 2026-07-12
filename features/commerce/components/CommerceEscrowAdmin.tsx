import { formatCurrency } from "@/lib/wallet/utils";
import type { AdminEscrowOverview } from "@/lib/commerce-engine/read-model";

type CommerceEscrowAdminProps = {
  overview: AdminEscrowOverview;
};

export function CommerceEscrowAdmin({ overview }: CommerceEscrowAdminProps) {
  const metrics = [
    { label: "Pending seller funds", value: formatCurrency(overview.escrowPending) },
    { label: "Released funds", value: formatCurrency(overview.released) },
    { label: "Platform fee (today)", value: formatCurrency(overview.platformFeeToday) },
    { label: "Platform fee (week)", value: formatCurrency(overview.platformFeeWeek) },
    { label: "Platform fee (month)", value: formatCurrency(overview.platformFeeMonth) },
    { label: "Platform fee (lifetime)", value: formatCurrency(overview.platformFeeReserved) },
    { label: "Shipping reserve", value: formatCurrency(overview.shippingReserve) },
    { label: "Orders on hold", value: String(overview.onHoldOrders) },
    { label: "Failed withdrawals", value: String(overview.failedWithdrawals) },
  ];

  return (
    <section className="rounded-ds-lg border border-border bg-surface p-ds-5">
      <header className="mb-ds-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Finance Dashboard</p>
        <h2 className="text-lg font-semibold text-text-primary">Escrow & settlement</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Buyer pays immediately. Platform fee is collected at checkout. Seller funds release after delivery and buyer protection.
        </p>
      </header>
      <div className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-ds-md bg-surface-muted px-ds-4 py-ds-3">
            <p className="text-xs text-text-muted">{metric.label}</p>
            <p className="mt-ds-1 text-lg font-semibold text-text-primary">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
