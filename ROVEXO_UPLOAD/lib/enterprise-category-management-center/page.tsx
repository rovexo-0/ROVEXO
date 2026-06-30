import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseCategoryManagementAdmin } from "@/features/super-admin/enterprise-category-management-center/EnterpriseCategoryManagementAdmin";
import { getCategoryManagementPageData } from "@/lib/enterprise-category-management-center/reader";
import type { CategoryManagementTab } from "@/lib/enterprise-category-management-center/types";

type CategoryManagementPageProps = { tab: CategoryManagementTab; title: string; description: string };

export async function renderCategoryManagementPage({ tab, title, description }: CategoryManagementPageProps) {
  const { snapshot } = await getCategoryManagementPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseCategoryManagementAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function categoryManagementMetadata(title: string) {
  return { title: `${title} · Category Management Center` };
}
