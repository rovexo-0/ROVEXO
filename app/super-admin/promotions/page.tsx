import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAdminPromotionStats } from "@/lib/promotions/admin";

export default async function SuperAdminPromotionsPage() {
  const stats = await getAdminPromotionStats();

  return (
    <>
      <SuperAdminPageHeader title="Promotions" description="Featured listings, bumps, and campaigns." />
      <div className="grid gap-ds-4 sm:grid-cols-2">
        <Card padding="md">
          <p className="text-sm text-text-secondary">Active featured listings</p>
          <p className="mt-ds-1 text-3xl font-bold">{stats.featureCount}</p>
          <Link href="/super-admin/featured" className="mt-ds-3 inline-block text-sm font-semibold text-primary">
            Manage featured
          </Link>
        </Card>
        <Card padding="md">
          <p className="text-sm text-text-secondary">Active bumps</p>
          <p className="mt-ds-1 text-3xl font-bold">{stats.bumpCount}</p>
          <Link href="/super-admin/bumps" className="mt-ds-3 inline-block text-sm font-semibold text-primary">
            Manage bumps
          </Link>
        </Card>
      </div>
    </>
  );
}
