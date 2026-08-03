import { omegaEnterpriseMetadata, renderOmegaEnterprisePage } from "@/lib/omega-enterprise-mobile-engine/page";

export default async function SuperAdminOmegaCertificationsPage() {
  return renderOmegaEnterprisePage({
    tab: "certifications",
    title: "Certification Center",
    description: "OMEGA GOLD, Guardian, Sentinel, compliance, and trust certification status.",
  });
}

export async function generateMetadata() {
  return omegaEnterpriseMetadata("Certification Center");
}
