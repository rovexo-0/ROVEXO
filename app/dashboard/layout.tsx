import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["super_admin"]);
  } catch {
    redirect("/403");
  }

  return children;
}
