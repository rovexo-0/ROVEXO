import { renderDeploymentPage, deploymentMetadata } from "@/lib/enterprise-deployment-center/page";

export default async function SuperAdminDeploymentEnvironmentsPage() {
  return renderDeploymentPage({ tab: "environments", title: "Environment Center", description: "Manage development through production environments." });
}

export async function generateMetadata() {
  return deploymentMetadata("Environments");
}
