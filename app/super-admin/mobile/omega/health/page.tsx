import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaHealthPage() {
  return renderOmegaEnterprisePage({
    tab: "health",
    title: "Global Health",
    description: "Overall and per-domain health scores across the enterprise platform.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Global Health");
}
