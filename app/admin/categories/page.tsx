import { CategoriesAdmin } from "@/features/admin/components/CategoriesAdmin";
import { listAdminCategories } from "@/lib/categories/admin";

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();

  return <CategoriesAdmin initialCategories={categories} />;
}
