import { Card } from "@/components/ui/Card";
import { getMonetizationOverview, listMonetizationPlans } from "@/lib/monetization/service";

export default async function AdminMonetizationPage() {
  const [overview, plans] = await Promise.all([getMonetizationOverview(), listMonetizationPlans()]);

  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Monetization Administration</h2>
      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Active subscriptions</p>
          <p className="mt-ds-1 text-2xl font-bold">{overview.activeSubscriptions}</p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Plans</p>
          <p className="mt-ds-1 text-2xl font-bold">{plans.length}</p>
        </Card>
      </div>
      <Card padding="lg" className="">
        <h3 className="font-semibold">Plans</h3>
        <ul className="mt-ds-4 space-y-ds-2 text-sm">
          {plans.map((plan) => (
            <li key={plan.id} className="flex items-center justify-between gap-ds-3 border-b border-border pb-ds-2">
              <span>{plan.name}</span>
              <span className="text-text-secondary">
                {plan.priceCents === 0 ? "Free" : `£${(plan.priceCents / 100).toFixed(2)}/${plan.interval}`}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
