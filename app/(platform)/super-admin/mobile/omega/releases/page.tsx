import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaReleasesPage() {
  return renderOmegaEnterprisePage({
    tab: "releases",
    title: "Release Center",
    description: "Production, beta, rollback, and deployment health monitoring.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Release Center");
}
