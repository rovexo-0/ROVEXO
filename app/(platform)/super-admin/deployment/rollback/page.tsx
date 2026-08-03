import { renderDeploymentPage, deploymentMetadata } from "@/lib/enterprise-deployment-center/page";

export default async function SuperAdminDeploymentRollbackPage() {
  return renderDeploymentPage({ tab: "rollback", title: "Rollback Center", description: "One-click, emergency, and AI-recommended rollbacks." });
}

export async function generateMetadata() {
  return deploymentMetadata("Rollback Center");
}
