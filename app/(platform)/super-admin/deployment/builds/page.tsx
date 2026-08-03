import { renderDeploymentPage, deploymentMetadata } from "@/lib/enterprise-deployment-center/page";

export default async function SuperAdminDeploymentBuildsPage() {
  return renderDeploymentPage({ tab: "builds", title: "Build & Deploy", description: "Build validation, deployment strategies, and artifact integrity." });
}

export async function generateMetadata() {
  return deploymentMetadata("Build & Deploy");
}
