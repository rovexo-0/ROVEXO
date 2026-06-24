import { CategoriesAdmin } from "@/features/admin/components/CategoriesAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { listAdminCategories } from "@/lib/categories/admin";

export default async function SuperAdminCategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <>
      <SuperAdminPageHeader title="Categories" description="Manage the ROVEXO category taxonomy." />
      <CategoriesAdmin initialCategories={categories} />
    </>
  );
}
