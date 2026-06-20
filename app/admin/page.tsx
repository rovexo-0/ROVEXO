import { getAdminStats } from "@/lib/admin/queries";
import { Card } from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-ds-5">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="lg" className="shadow-ds-soft">
          <p className="text-sm text-text-secondary">Total orders</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.totalOrders}</p>
        </Card>
        <Card padding="lg" className="shadow-ds-soft">
          <p className="text-sm text-text-secondary">Awaiting payment</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.awaitingPayment}</p>
        </Card>
        <Card padding="lg" className="shadow-ds-soft">
          <p className="text-sm text-text-secondary">Awaiting shipment</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.awaitingShipment}</p>
        </Card>
        <Card padding="lg" className="shadow-ds-soft">
          <p className="text-sm text-text-secondary">Completed</p>
          <p className="mt-ds-1 text-2xl font-bold">{stats.completed}</p>
        </Card>
      </div>
    </div>
  );
}
