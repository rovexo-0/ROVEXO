import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "dashboard",
    title: "Audit Readiness & Certification",
    description: "Continuous audit readiness, compliance maturity, and certification intelligence.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Audit Readiness & Certification");
}
