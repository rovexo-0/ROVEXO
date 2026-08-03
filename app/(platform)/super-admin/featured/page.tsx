import { AdminPromotionsPage } from "@/features/admin/components/AdminPromotionsPage";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAdminPromotionStats, listAdminPromotions } from "@/lib/promotions/admin";

export default async function SuperAdminFeaturedPage() {
  const [promotions, stats] = await Promise.all([
    listAdminPromotions({ type: "feature", limit: 100 }),
    getAdminPromotionStats(),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Featured Listings" description="Manage featured placement campaigns." />
      <AdminPromotionsPage initialPromotions={promotions} initialStats={stats} />
    </>
  );
}
