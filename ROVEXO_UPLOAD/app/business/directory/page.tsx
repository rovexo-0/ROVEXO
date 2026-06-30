import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BusinessDirectoryPage } from "@/features/business/components/BusinessDirectoryPage";
import { listBusinessDirectory } from "@/lib/business/directory";

export const metadata: Metadata = {
  title: "Business Directory | ROVEXO",
  description: "Discover verified business sellers, manufacturers, and suppliers on ROVEXO.",
};

export default async function BusinessDirectoryRoute() {
  const companies = await listBusinessDirectory();
  return (
    <BetaAppShell showBottomNav={false}>
      <BusinessDirectoryPage companies={companies} />
    </BetaAppShell>
  );
}
