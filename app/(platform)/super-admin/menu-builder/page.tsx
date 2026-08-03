import { MenuBuilderPanel } from "@/features/super-admin/platform-visual/MenuBuilderPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPlatformVisualConfig } from "@/lib/platform-visual/reader";

export default async function SuperAdminMenuBuilderPage() {
  const visualConfig = await getPlatformVisualConfig({ mode: "live" });

  return (
    <>
      <SuperAdminPageHeader
        title="Menu Builder"
        description="Configure top, bottom, mobile, desktop, footer, and account menus for the live platform."
      />
      <MenuBuilderPanel initialMenus={visualConfig.menus} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Menu Builder | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
