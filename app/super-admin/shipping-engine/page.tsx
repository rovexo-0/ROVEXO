import { ShippingEngineAdmin } from "@/features/super-admin/shipping-engine/ShippingEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getShippingEngineSnapshot } from "@/lib/shipping-engine/reader";

export default async function SuperAdminShippingEnginePage() {
  const snapshot = await getShippingEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Shipping Engine"
        description="Configure shipping methods, zones, rules, carriers, tracking, returns, notifications, and buyer protection integration."
      />
      <ShippingEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Shipping Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
