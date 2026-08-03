import { moduleRegistryMetadata, renderModuleRegistryPage } from "@/lib/enterprise-module-registry-v2/page";

export default async function ModuleRegistryModulesPage() {
  return renderModuleRegistryPage({
    tab: "modules",
    title: "Registered Modules",
    description: "All modules discovered and registered through the Enterprise Module Registry V2.",
  });
}

export async function generateMetadata() {
  return moduleRegistryMetadata("Modules");
}
