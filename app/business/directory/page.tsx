import type { Metadata } from "next";
import { CanonicalPageShell } from "@/components/layout/CanonicalPageShell";
import { BusinessDirectoryPage } from "@/features/business/components/BusinessDirectoryPage";
import { listBusinessDirectory } from "@/lib/business/directory";

export const metadata: Metadata = {
  title: "Business Directory | ROVEXO",
  description: "Discover verified business sellers, manufacturers, and suppliers on ROVEXO.",
};

export default async function BusinessDirectoryRoute() {
  const companies = await listBusinessDirectory();

  return (
    <CanonicalPageShell
      title="Business Directory"
      backHref="/business/dashboard"
      backLabel="Business tools"
      showBottomNav={false}
      contentClassName="max-w-6xl gap-ds-6 py-ds-5"
    >
      <BusinessDirectoryPage companies={companies} />
    </CanonicalPageShell>
  );
}
