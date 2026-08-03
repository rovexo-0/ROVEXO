import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAdminPromotionStats } from "@/lib/promotions/admin";

export default async function SuperAdminPromotionsPage() {
  const stats = await getAdminPromotionStats();

  return (
    <>
      <SuperAdminPageHeader title="Promotions" description="Featured listings, bumps, and campaigns." />
      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card padding="md">
          <p className="text-sm text-text-secondary">User promotions</p>
          <p className="mt-ds-1 text-sm text-text-primary">Search, grant, and manage per-account promotions</p>
          <Link
            href="/super-admin/promotion-management"
            className="mt-ds-3 inline-block text-sm font-semibold text-primary"
          >
            Open User Promotions
          </Link>
        </Card>
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
        <Card padding="md">
          <p className="text-sm text-text-secondary">Marketplace pricing</p>
          <p className="mt-ds-1 text-sm text-text-primary">Boost · Showcase · Business</p>
          <div className="mt-ds-3 flex flex-wrap gap-ds-3">
            <Link href="/super-admin/pricing" className="text-sm font-semibold text-primary">
              Open pricing manager
            </Link>
            <Link href="/super-admin/promotion-catalog" className="text-sm font-semibold text-primary">
              Edit promotion cards
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
