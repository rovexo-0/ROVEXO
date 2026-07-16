import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole(["super_admin"]);
  } catch {
    redirect("/403");
  }

  return (
    <div data-universal-ui="v1.1" data-universal-ui-status="preview">
      {children}
    </div>
  );
}
