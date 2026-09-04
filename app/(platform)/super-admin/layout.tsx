import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { SuperAdminShell } from "@/features/super-admin/components/SuperAdminShell";

/**
 * Runtime-only. Super Admin pages read service-role secrets; they must never
 * statically prerender during `next build`.
 */
export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["super_admin"]);
  } catch {
    redirect("/403");
  }

  return <SuperAdminShell>{children}</SuperAdminShell>;
}

export async function generateMetadata() {
  return {
    title: "Super Admin Command Centre | ROVEXO",
    robots: { index: false, follow: false },
  };
}
