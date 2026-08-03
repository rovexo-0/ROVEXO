import type { Metadata } from "next";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { BusinessDirectoryPage } from "@/features/business/components/BusinessDirectoryPage";
import { listBusinessDirectory } from "@/lib/business/directory";

export const metadata: Metadata = {
  title: "Business Directory | ROVEXO",
  description: "Discover verified business sellers, manufacturers, and suppliers on ROVEXO.",
};

export default async function BusinessDirectoryRoute() {
  const companies = await listBusinessDirectory();

  return (
    <AccountCanonicalShell
      title="Business Directory"
      backHref="/business/dashboard"
      backLabel="Business"
      showHeaderTitle
      showBottomNav={false}
    >
      <BusinessDirectoryPage companies={companies} />
    </AccountCanonicalShell>
  );
}
