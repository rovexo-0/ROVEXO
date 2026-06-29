import {
  EnterpriseModuleRegistryAdmin,
  type ModuleRegistryV2Tab,
} from "@/features/super-admin/enterprise-module-registry/EnterpriseModuleRegistryAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getModuleRegistryPageData } from "@/lib/enterprise-module-registry-v2/reader";

type ModuleRegistryPageProps = {
  tab: ModuleRegistryV2Tab;
  title: string;
  description: string;
};

export async function renderModuleRegistryPage({ tab, title, description }: ModuleRegistryPageProps) {
  const { snapshot } = await getModuleRegistryPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseModuleRegistryAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function moduleRegistryMetadata(title: string) {
  return { title: `${title} | Enterprise Module Registry | ROVEXO`, robots: { index: false, follow: false } };
}
