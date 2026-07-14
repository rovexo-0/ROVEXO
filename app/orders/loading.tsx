import { AccountCanonicalShell } from "@/features/account-canonical";
import { OrdersPageSkeleton } from "@/features/orders/components/OrdersPage";
import "@/styles/rovexo/orders-page-v1.css";

export default function OrdersLoading() {
  return (
    <AccountCanonicalShell title="Orders" backHref="/account">
      <OrdersPageSkeleton />
    </AccountCanonicalShell>
  );
}
