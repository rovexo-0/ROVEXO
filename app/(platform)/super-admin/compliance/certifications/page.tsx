import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "certifications",
    title: "Certification Dashboard",
    description: "Certification readiness across enterprise standards.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Certification Dashboard");
}
