import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseE2eValidationAdmin } from "@/features/super-admin/enterprise-e2e-validation-engine/EnterpriseE2eValidationAdmin";
import { getE2eValidationPageData } from "@/lib/enterprise-e2e-validation-engine/reader";
import type { E2eValidationTab } from "@/lib/enterprise-e2e-validation-engine/types";

type E2eValidationPageProps = { tab: E2eValidationTab; title: string; description: string };

export async function renderE2eValidationPage({ tab, title, description }: E2eValidationPageProps) {
  const { snapshot } = await getE2eValidationPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseE2eValidationAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function e2eValidationMetadata(title: string) {
  return { title: `${title} · Enterprise E2E Validation Engine` };
}
