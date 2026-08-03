import { ThemeStudioPro } from "@/features/super-admin/platform-visual/ThemeStudioPro";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPlatformVisualDraft, getPlatformVisualHistory } from "@/lib/platform-visual/reader";

export default async function SuperAdminThemeStudioPage() {
  const [draft, history] = await Promise.all([getPlatformVisualDraft(), getPlatformVisualHistory()]);

  return (
    <>
      <SuperAdminPageHeader
        title="Theme Studio Pro"
        description="Professional visual platform designer — infinite canvas, component library, templates, assets, menus, homepage design, and live publish."
      />
      <ThemeStudioPro initialDraft={draft} initialHistory={history} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Theme Studio Pro | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
