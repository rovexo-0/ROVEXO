import { moduleRegistryMetadata, renderModuleRegistryPage } from "@/lib/enterprise-module-registry-v2/page";

export default async function ModuleRegistryHistoryPage() {
  return renderModuleRegistryPage({
    tab: "history",
    title: "Registry History",
    description: "Publish, rollback, and audit history for the enterprise module registry.",
  });
}

export async function generateMetadata() {
  return moduleRegistryMetadata("History");
}
