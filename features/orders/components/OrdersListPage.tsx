import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Card } from "@/components/ui/Card";
import { OrderListItem } from "@/features/orders/components/OrderListItem";
import type { Order, OrderViewRole } from "@/lib/orders/types";

type OrdersListPageProps = {
  orders: Order[];
  userId: string;
  listRole: OrderViewRole;
  backHref: string;
  showBottomNav?: boolean;
  bottomNavTab?: "account" | "sell";
};

export function OrdersListPage({
  orders,
  userId,
  listRole,
  backHref,
  showBottomNav = true,
  bottomNavTab = "account",
}: OrdersListPageProps) {
  const title = listRole === "buyer" ? "Orders" : "Seller Orders";

  return (
    <BetaAppShell bottomNavTab={showBottomNav ? bottomNavTab : undefined} showBottomNav={showBottomNav}>
      <BetaPageHeader title={title} backHref={backHref} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        {orders.length === 0 ? (
          <Card padding="lg" className="text-center shadow-ds-soft">
            <p className="text-sm text-text-secondary">No orders yet.</p>
          </Card>
        ) : (
          orders.map((order) => <OrderListItem key={order.id} order={order} userId={userId} />)
        )}
      </main>
    </BetaAppShell>
  );
}
