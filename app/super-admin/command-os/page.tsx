import { CommandOsShell } from "@/features/super-admin/command-os-v4/CommandOsShell";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getCommandOsSnapshot } from "@/lib/command-os-v4";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SuperAdminCommandOsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const snapshot = await getCommandOsSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="ROVEXO Command OS"
        description="Enterprise v4.0 — the permanent operating system of the entire ROVEXO ecosystem."
      />
      <CommandOsShell initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "ROVEXO Command OS | Super Admin",
    robots: { index: false, follow: false },
  };
}
