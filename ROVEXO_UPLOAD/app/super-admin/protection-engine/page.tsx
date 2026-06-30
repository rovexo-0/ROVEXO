import { ProtectionEngineAdmin } from "@/features/super-admin/protection-engine/ProtectionEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getProtectionEngineSnapshot } from "@/lib/protection-engine/reader";

export default async function SuperAdminProtectionEnginePage() {
  const snapshot = await getProtectionEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Buyer Protection Engine"
        description="Enterprise trust and dispute system — cases, evidence, resolutions, abuse detection, and integrations."
      />
      <ProtectionEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Buyer Protection Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
