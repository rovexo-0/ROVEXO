import { renderDeploymentPage, deploymentMetadata } from "@/lib/enterprise-deployment-center/page";

export default async function SuperAdminDeploymentPage() {
  return renderDeploymentPage({
    tab: "dashboard",
    title: "Deployment Center",
    description: "Production deployment gateway — validate, approve, deploy, and rollback.",
  });
}

export async function generateMetadata() {
  return deploymentMetadata("Dashboard");
}
