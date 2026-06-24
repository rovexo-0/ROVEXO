import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { listAdminOrders } from "@/lib/admin/queries";
import { isStripeConfigured } from "@/lib/stripe/server";

export default async function SuperAdminPaymentsPage() {
  const orders = await listAdminOrders();
  const stripeReady = isStripeConfigured();

  return (
    <>
      <SuperAdminPageHeader title="Payments" description="Transactions, refunds, Stripe status, and invoices." />
      <Card padding="md" className="mb-ds-4 bg-white">
        <p className="text-sm text-text-secondary">Stripe integration</p>
        <p className="text-lg font-semibold">{stripeReady ? "Connected" : "Not configured"}</p>
      </Card>
      <div className="space-y-ds-3">
        {orders.slice(0, 30).map((order) => (
          <Card key={order.id} padding="md" className="bg-white">
            <div className="flex flex-wrap items-center justify-between gap-ds-2">
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-text-secondary">
                  {order.status} · £{order.total.toFixed(2)}
                </p>
              </div>
              <Link href={`/orders/${order.id}`} className="text-sm font-medium text-primary">
                View order
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
