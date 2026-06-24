import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminBackupsPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Backup Centre"
        description="Database backups are managed through Supabase. Use this centre to track backup policy and recovery procedures."
      />
      <div className="grid gap-ds-4 md:grid-cols-2">
        <Card padding="md" className="bg-white">
          <h3 className="font-semibold">Automatic backups</h3>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Supabase Pro includes daily automated backups with point-in-time recovery. Verify backup
            retention in the Supabase project dashboard.
          </p>
        </Card>
        <Card padding="md" className="bg-white">
          <h3 className="font-semibold">Manual export</h3>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Run a manual SQL dump before major releases. Document exports in the audit log after each
            backup operation.
          </p>
        </Card>
        <Card padding="md" className="bg-white md:col-span-2">
          <h3 className="font-semibold">Restore procedure</h3>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Enable maintenance mode, restore from Supabase backup, verify migrations, run health checks,
            then disable maintenance mode from Platform Settings.
          </p>
        </Card>
      </div>
    </>
  );
}
