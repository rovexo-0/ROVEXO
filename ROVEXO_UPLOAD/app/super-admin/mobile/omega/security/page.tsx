import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaSecurityPage() {
  return renderOmegaEnterprisePage({
    tab: "security",
    title: "Security Overview",
    description: "Guardian, Sentinel, threat level, authentication health, and OMEGA action center.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Security Overview");
}
