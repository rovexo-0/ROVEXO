import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
/* OPT-HP-LCP-CSS: [data-universal-ui] rules — not on Canonical Homepage. */
import "@/styles/rovexo/universal-ui-v1.css";

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
