import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaDashboardPage() {
  return renderOmegaEnterprisePage({
    tab: "dashboard",
    title: "OMEGA Dashboard",
    description: "Live platform health, system status, and alert summary.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("OMEGA Dashboard");
}
