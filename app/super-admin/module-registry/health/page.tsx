import { moduleRegistryMetadata, renderModuleRegistryPage } from "@/lib/enterprise-module-registry-v2/page";

export default async function ModuleRegistryHealthPage() {
  return renderModuleRegistryPage({
    tab: "health",
    title: "Registry Health",
    description: "Live health monitoring for all registered enterprise modules.",
  });
}

export async function generateMetadata() {
  return moduleRegistryMetadata("Health");
}
