import { SeoAdminDashboard } from "@/features/admin/components/SeoAdminDashboard";
import { runSeoAudit } from "@/lib/seo/audit";

export default async function AdminSeoPage() {
  const report = runSeoAudit();
  return <SeoAdminDashboard initialReport={report} />;
}
