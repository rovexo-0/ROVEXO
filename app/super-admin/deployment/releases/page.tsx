import { renderDeploymentPage, deploymentMetadata } from "@/lib/enterprise-deployment-center/page";

export default async function SuperAdminDeploymentReleasesPage() {
  return renderDeploymentPage({ tab: "releases", title: "Release Center", description: "Create and manage release candidates, hotfixes, and scheduled releases." });
}

export async function generateMetadata() {
  return deploymentMetadata("Releases");
}
