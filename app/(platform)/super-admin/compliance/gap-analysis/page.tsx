import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "gap-analysis",
    title: "Gap Analysis",
    description: "Identify missing controls, evidence, and documentation.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Gap Analysis");
}
