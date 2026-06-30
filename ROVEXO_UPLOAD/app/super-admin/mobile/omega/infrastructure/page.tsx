import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaInfrastructurePage() {
  return renderOmegaEnterprisePage({
    tab: "infrastructure",
    title: "Infrastructure",
    description: "CPU, RAM, disk, network, latency, and database connection monitoring.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Infrastructure");
}
