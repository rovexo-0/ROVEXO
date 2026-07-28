import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

/**
 * Platform Admin Console (`/admin/*`).
 * Access: `admin` + `super_admin` (aligned with `requireAdmin()`).
 * Super Admin Command Center remains `/super-admin` (separate surface).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["admin", "super_admin"]);
  } catch {
    redirect("/403");
  }

  return <>{children}</>;
}

export async function generateMetadata() {
  return { title: "Admin | ROVEXO", robots: { index: false, follow: false } };
}
