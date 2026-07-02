import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaScansPage() {
  return renderOmegaEnterprisePage({
    tab: "scans",
    title: "Global Scan",
    description: "Unified Guardian, Sentinel, Antivirus, infrastructure, and compliance scanning.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Global Scan");
}
