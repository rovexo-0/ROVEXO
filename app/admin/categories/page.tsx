import { redirect } from "next/navigation";

export default function LegacyAdminCategoriesRedirect() {
  redirect("/super-admin/category-management");
}
