import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

/**
 * @deprecated LEGACY ADMIN LAYER (v1.0 navigation decision).
 *
 * The `/admin/*` tree is retained temporarily as a legacy layer to avoid
 * regressions. It currently super-admin-gates then redirects to `/super-admin`
 * (behaviour intentionally unchanged). Once the new Super Admin Command Center
 * is fully implemented and production-validated, migrate remaining admin
 * functionality and formalise these redirects. Do NOT extend this tree.
 */
export default async function AdminLayout({ children: _children }: { children: React.ReactNode }) {
  void _children;
  try {
    await requireRole(["super_admin"]);
  } catch {
    redirect("/403");
  }

  redirect("/super-admin");
}

export async function generateMetadata() {
  return { title: "Admin | ROVEXO", robots: { index: false, follow: false } };
}
