import { AppStudio } from "@/features/super-admin/app-studio/AppStudio";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAppStudioSnapshot } from "@/lib/app-studio/snapshot";

export default async function SuperAdminAppStudioPage() {
  const snapshot = await getAppStudioSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="App Studio"
        description="Enterprise operating system for managing modules, pages, navigation, features, AI, automations, security, analytics, recovery, and platform health."
      />
      <AppStudio initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "App Studio | ROVEXO",
    robots: { index: false, follow: false },
  };
}
