import { moduleRegistryMetadata, renderModuleRegistryPage } from "@/lib/enterprise-module-registry-v2/page";

export default async function ModuleRegistrySearchPage() {
  return renderModuleRegistryPage({
    tab: "search",
    title: "Registry Search",
    description: "Search modules by category, route, permission, feature flag, dependency, and API.",
  });
}

export async function generateMetadata() {
  return moduleRegistryMetadata("Search");
}
