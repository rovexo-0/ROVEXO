import { redirect } from "next/navigation";

export default function LegacyCategoriesRedirect() {
  redirect("/super-admin/category-management");
}
