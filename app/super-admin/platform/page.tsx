import { SuperAdminPlatformPanel } from "@/features/super-admin/components/SuperAdminPlatformPanel";
import { SuperAdminAutomationPanel } from "@/features/super-admin/components/SuperAdminAutomationPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminPlatformPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Platform Settings"
        description="Maintenance mode, feature visibility, announcements, automation, and global configuration."
      />
      <div className="space-y-ds-6">
        <SuperAdminPlatformPanel />
        <SuperAdminAutomationPanel />
      </div>
    </>
  );
}
