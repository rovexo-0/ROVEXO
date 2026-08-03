import { SearchEngineAdmin } from "@/features/super-admin/search-engine/SearchEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getSearchEngineSnapshot } from "@/lib/search-engine/reader";

export default async function SuperAdminSearchEnginePage() {
  const snapshot = await getSearchEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Search Engine"
        description="Enterprise search and discovery — indexes, filters, analytics, and cross-module search."
      />
      <SearchEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Search Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
