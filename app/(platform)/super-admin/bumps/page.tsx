import { AdminPromotionsPage } from "@/features/admin/components/AdminPromotionsPage";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAdminPromotionStats, listAdminPromotions } from "@/lib/promotions/admin";

export default async function SuperAdminBumpsPage() {
  const [promotions, stats] = await Promise.all([
    listAdminPromotions({ type: "bump", limit: 100 }),
    getAdminPromotionStats(),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Bumps" description="Manage listing bump promotions." />
      <AdminPromotionsPage initialPromotions={promotions} initialStats={stats} />
    </>
  );
}
