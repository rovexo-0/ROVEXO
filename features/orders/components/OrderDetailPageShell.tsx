import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { cn } from "@/lib/cn";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import { resolveOrderViewRole } from "@/lib/orders/role";
import type { Order } from "@/lib/orders/types";

type OrderDetailPageShellProps = {
  order: Order;
  userId: string;
  backHref: string;
  showBottomNav?: boolean;
  bottomNavTab?: "account" | "sell";
};

export function OrderDetailPageShell({
  order,
  userId,
  backHref,
  showBottomNav = true,
  bottomNavTab = "account",
}: OrderDetailPageShellProps) {
  const view = resolveOrderViewRole(order, userId);
  const isCompleted = view === "buyer" && order.status === "completed";

  return (
    <BetaAppShell bottomNavTab={showBottomNav ? bottomNavTab : undefined} showBottomNav={showBottomNav}>
      {!isCompleted && <BetaPageHeader title="Order Details" backHref={backHref} />}

      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col",
          isCompleted
            ? "min-h-[100dvh] justify-center px-ds-4 py-ds-6"
            : "px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]",
        )}
      >
        <OrderDetailView initialOrder={order} userId={userId} />
      </main>
    </BetaAppShell>
  );
}
