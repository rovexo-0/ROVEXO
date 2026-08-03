import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaAnalyticsPage() {
  return renderOmegaEnterprisePage({
    tab: "analytics",
    title: "Analytics",
    description: "Live users, sessions, revenue, conversion, and module activity.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Analytics");
}
