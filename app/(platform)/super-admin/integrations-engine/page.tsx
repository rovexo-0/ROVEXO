import { IntegrationsEngineAdmin } from "@/features/super-admin/integrations-engine/IntegrationsEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getIntegrationsEngineSnapshot } from "@/lib/integrations-engine/reader";

export default async function SuperAdminIntegrationsEnginePage() {
  const snapshot = await getIntegrationsEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Integrations Engine"
        description="Enterprise external services — providers, webhooks, secrets, API health, and monitoring."
      />
      <IntegrationsEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Integrations Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
