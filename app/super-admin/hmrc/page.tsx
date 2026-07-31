import { HmrcSettingsPanel } from "@/features/super-admin/hmrc/HmrcSettingsPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminHmrcSettingsPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="HMRC Settings"
        description="Threshold, warning percentages, reporting rules, and UK tax year — no database editing required."
      />
      <HmrcSettingsPanel />
    </>
  );
}

export async function generateMetadata() {
  return { title: "HMRC Settings | ROVEXO", robots: { index: false, follow: false } };
}
