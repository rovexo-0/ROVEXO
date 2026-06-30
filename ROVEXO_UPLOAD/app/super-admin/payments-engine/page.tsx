import { PaymentsEngineAdmin } from "@/features/super-admin/payments-engine/PaymentsEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPaymentsEngineSnapshot } from "@/lib/payments-engine/reader";

export default async function SuperAdminPaymentsEnginePage() {
  const snapshot = await getPaymentsEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Payments Engine"
        description="Enterprise payment orchestration — methods, providers, verification, fraud prevention, and integrations."
      />
      <PaymentsEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Payments Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
