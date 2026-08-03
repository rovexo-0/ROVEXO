import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { AdminCommandCentreShell } from "@/features/command-centre/AdminCommandCentreShell";

/**
 * Platform Admin Console (`/admin/*`).
 * Access: `admin` + `super_admin`.
 * UI: shared Command Centre White Theme (same shell as Super Admin).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["admin", "super_admin"]);
  } catch {
    redirect("/403");
  }

  return <AdminCommandCentreShell>{children}</AdminCommandCentreShell>;
}

export async function generateMetadata() {
  return { title: "Admin Command Centre | ROVEXO", robots: { index: false, follow: false } };
}
