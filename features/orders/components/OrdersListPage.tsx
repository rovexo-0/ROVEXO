import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
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
          <EmptyState
            title="No orders yet"
            description="When you buy or sell on ROVEXO, your orders will appear here."
            actionLabel="Browse listings"
            actionHref="/"
          />
        ) : (
          orders.map((order) => <OrderListItem key={order.id} order={order} userId={userId} />)
        )}
      </main>
      <HelpPageFooter pathname="/orders" />
    </BetaAppShell>
  );
}
