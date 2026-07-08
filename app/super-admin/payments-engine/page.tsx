import { PaymentsEngineAdmin } from "@/features/super-admin/payments-engine/PaymentsEngineAdmin";
import { CommerceEscrowAdmin } from "@/features/commerce/components/CommerceEscrowAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAdminEscrowOverview } from "@/lib/commerce-engine/read-model";
import { getPaymentsEngineSnapshot } from "@/lib/payments-engine/reader";

export default async function SuperAdminPaymentsEnginePage() {
  const [snapshot, escrowOverview] = await Promise.all([
    getPaymentsEngineSnapshot(),
    getAdminEscrowOverview(),
  ]);

  return (
    <>
      <SuperAdminPageHeader
        title="Payments Engine"
        description="Enterprise payment orchestration — methods, providers, verification, fraud prevention, and integrations."
      />
      <div className="mb-ds-6">
        <CommerceEscrowAdmin overview={escrowOverview} />
      </div>
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
