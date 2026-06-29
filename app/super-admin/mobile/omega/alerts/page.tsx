import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaAlertsPage() {
  return renderOmegaEnterprisePage({
    tab: "alerts",
    title: "Alert Center",
    description: "Critical, high, medium, and low severity alerts with recommended actions.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Alert Center");
}
