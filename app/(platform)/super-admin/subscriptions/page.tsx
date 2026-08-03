import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMonetizationOverview } from "@/lib/monetization/service";

export default async function SuperAdminSubscriptionsPage() {
  const overview = await getMonetizationOverview();

  return (
    <>
      <SuperAdminPageHeader title="Subscriptions" description="Active plans and subscription billing overview." />
      <div className="grid gap-ds-3 md:grid-cols-3">
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Active subscriptions</p>
          <p className="text-3xl font-bold">{overview.activeSubscriptions}</p>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Available plans</p>
          <p className="text-3xl font-bold">{overview.plans.length}</p>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="text-sm text-text-secondary">Promotion revenue (month)</p>
          <p className="text-3xl font-bold">£{(overview.promotionRevenueCents / 100).toFixed(0)}</p>
        </Card>
      </div>
    </>
  );
}
