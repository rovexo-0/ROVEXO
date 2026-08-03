import { Card } from "@/components/ui/Card";
import { getWholesaleAnalyticsSummary } from "@/lib/wholesale/service";

export default async function AdminWholesalePage() {
  const summary = await getWholesaleAnalyticsSummary();

  return (
    <div className="space-y-ds-6">
      <h2 className="text-xl font-semibold">Wholesale Administration</h2>
      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Wholesale accounts</p>
          <p className="mt-ds-1 text-2xl font-bold">{summary.accounts}</p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Open RFQs</p>
          <p className="mt-ds-1 text-2xl font-bold">{summary.openRfqs}</p>
        </Card>
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Pricing tiers</p>
          <p className="mt-ds-1 text-2xl font-bold">{summary.pricingTiers}</p>
        </Card>
      </div>
    </div>
  );
}
