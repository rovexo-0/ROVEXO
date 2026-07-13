import { AccountCanonicalShell } from "@/features/account-canonical";
import { OrdersHubSkeleton } from "@/features/orders/components/OrdersHubV1";
import "@/styles/rovexo/orders-hub-v1.css";

export default function OrdersLoading() {
  return (
    <AccountCanonicalShell title="Orders" showHeaderTitle backHref="/account">
      <OrdersHubSkeleton />
    </AccountCanonicalShell>
  );
}
