import { formatCurrency } from "@/lib/wallet/utils";
import type { AdminEscrowOverview } from "@/lib/commerce-engine/read-model";

type CommerceEscrowAdminProps = {
  overview: AdminEscrowOverview;
};

export function CommerceEscrowAdmin({ overview }: CommerceEscrowAdminProps) {
  const metrics = [
    { label: "Escrow pending", value: formatCurrency(overview.escrowPending) },
    { label: "Released", value: formatCurrency(overview.released) },
    { label: "Platform fees", value: formatCurrency(overview.platformFeeReserved) },
    { label: "Shipping reserve", value: formatCurrency(overview.shippingReserve) },
    { label: "Orders on hold", value: String(overview.onHoldOrders) },
  ];

  return (
    <section className="rounded-ds-lg border border-border bg-surface p-ds-5">
      <header className="mb-ds-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Commerce Engine</p>
        <h2 className="text-lg font-semibold text-text-primary">Escrow & settlement</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Internal marketplace money state. Stripe and Parcel2Go rails are unchanged.
        </p>
      </header>
      <div className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-5">
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
