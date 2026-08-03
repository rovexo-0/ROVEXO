import { moduleRegistryMetadata, renderModuleRegistryPage } from "@/lib/enterprise-module-registry-v2/page";

export default async function ModuleRegistryDashboardPage() {
  return renderModuleRegistryPage({
    tab: "dashboard",
    title: "Enterprise Module Registry",
    description: "Central registry for discovering, validating, and orchestrating enterprise modules.",
  });
}

export async function generateMetadata() {
  return moduleRegistryMetadata("Dashboard");
}
