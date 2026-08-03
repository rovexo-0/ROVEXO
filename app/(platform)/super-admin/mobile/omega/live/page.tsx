import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaLivePage() {
  return renderOmegaEnterprisePage({
    tab: "live",
    title: "OMEGA Live",
    description: "Real-time monitoring across platform, marketplace, security, and certification modules.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("OMEGA Live");
}
