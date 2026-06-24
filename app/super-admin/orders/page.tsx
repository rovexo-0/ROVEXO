import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { listAdminOrders } from "@/lib/admin/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default async function SuperAdminOrdersPage() {
  const orders = await listAdminOrders();

  return (
    <>
      <SuperAdminPageHeader title="Orders" description="Platform-wide order management." />
      <div className="flex flex-col gap-ds-3">
        {orders.map((order) => (
          <Card key={order.id} padding="md">
            <div className="flex flex-wrap items-center justify-between gap-ds-3">
              <div>
                <p className="font-semibold text-text-primary">{order.orderNumber}</p>
                <p className="text-sm text-text-secondary">
                  {order.buyerName} → {order.sellerName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{getOrderStatusLabel(order.status)}</p>
                <p className="text-sm text-text-secondary">£{order.total.toFixed(2)}</p>
              </div>
            </div>
            <Link href={`/orders/${order.id}`} className="mt-ds-3 inline-block text-sm font-semibold text-primary">
              View order
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
