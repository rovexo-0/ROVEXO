import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaReportsPage() {
  return renderOmegaEnterprisePage({
    tab: "reports",
    title: "Reports",
    description: "Executive, security, infrastructure, compliance, and certification reports.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Reports");
}
