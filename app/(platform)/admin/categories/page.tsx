import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/roles";

/**
 * Category Management is Super Admin–scoped.
 * Admin role must never be bounced into `/super-admin/*` (403 trap).
 */
export default async function AdminCategoriesPage() {
  const session = await requireRole(["admin", "super_admin"]);

  if (isSuperAdmin(session.role)) {
    redirect("/super-admin/category-management");
  }

  return (
    <div className="flex flex-col gap-ds-4 p-ds-4" data-admin-categories="restricted">
      <h1 className="text-xl font-semibold text-text-primary">Categories</h1>
      <p className="text-sm text-text-secondary">
        Category Management is available only in the Super Admin Command Centre. This information
        is temporarily unavailable for Admin accounts.
      </p>
      <Link
        href="/admin"
        className="inline-flex min-h-11 w-full max-w-sm items-center justify-center rounded-ds-lg bg-brand px-ds-4 text-sm font-semibold text-white"
      >
        Back to Admin Command Centre
      </Link>
    </div>
  );
}
