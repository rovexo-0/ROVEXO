import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "compliance-timeline",
    title: "Compliance Timeline",
    description: "Track compliance evolution across standards.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Compliance Timeline");
}
