import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaPerformancePage() {
  return renderOmegaEnterprisePage({
    tab: "performance",
    title: "Performance",
    description: "Response time, API speed, cache hit rate, and performance trends.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Performance");
}
