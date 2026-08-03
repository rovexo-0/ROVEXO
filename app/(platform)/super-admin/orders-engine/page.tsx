import { OrdersEngineAdmin } from "@/features/super-admin/orders-engine/OrdersEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOrdersEngineSnapshot } from "@/lib/orders-engine/reader";

export default async function SuperAdminOrdersEnginePage() {
  const snapshot = await getOrdersEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Orders Engine"
        description="Enterprise order management — lifecycle, integrations, notifications, analytics, and purchase protection."
      />
      <OrdersEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Orders Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
