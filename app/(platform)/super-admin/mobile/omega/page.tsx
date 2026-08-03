import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaEnterprisePage() {
  return renderOmegaEnterprisePage({
    tab: "dashboard",
    title: "OMEGA Enterprise",
    description: "Enterprise command center for platform health, security, infrastructure, and certification.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("OMEGA Enterprise");
}
