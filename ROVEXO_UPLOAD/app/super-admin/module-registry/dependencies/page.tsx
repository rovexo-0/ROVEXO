import { moduleRegistryMetadata, renderModuleRegistryPage } from "@/lib/enterprise-module-registry-v2/page";

export default async function ModuleRegistryDependenciesPage() {
  return renderModuleRegistryPage({
    tab: "dependencies",
    title: "Dependency Graph",
    description: "Module dependencies, circular detection, and version conflict analysis.",
  });
}

export async function generateMetadata() {
  return moduleRegistryMetadata("Dependencies");
}
