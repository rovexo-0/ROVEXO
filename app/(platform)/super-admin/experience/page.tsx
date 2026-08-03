import { ExperienceShell } from "@/features/super-admin/experience-v3/ExperienceShell";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getXosSnapshot } from "@/lib/design-studio-v1";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SuperAdminExperiencePage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const snapshot = await getXosSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="ROVEXO Experience Operating System"
        description="Enterprise XOS v3.0 — every page, menu, screen, widget, theme, and feature from one control center."
      />
      <ExperienceShell initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "ROVEXO Experience Operating System | Super Admin",
    robots: { index: false, follow: false },
  };
}
