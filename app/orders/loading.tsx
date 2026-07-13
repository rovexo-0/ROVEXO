import { AccountCanonicalShell } from "@/features/account-canonical";
import { OrdersPageSkeleton } from "@/features/orders/components/OrdersPage";
import "@/styles/rovexo/orders-page-v1.css";

export default function OrdersLoading() {
  return (
    <AccountCanonicalShell title="Orders" showHeaderTitle backHref="/account">
      <OrdersPageSkeleton />
    </AccountCanonicalShell>
  );
}
