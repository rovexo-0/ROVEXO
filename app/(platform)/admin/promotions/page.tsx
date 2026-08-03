import { AdminPromotionsPage } from "@/features/admin/components/AdminPromotionsPage";
import { getAdminPromotionStats, listAdminPromotions } from "@/lib/promotions/admin";

export default async function AdminPromotionsRoutePage() {
  const [promotions, stats] = await Promise.all([
    listAdminPromotions({ limit: 100 }),
    getAdminPromotionStats(),
  ]);

  return <AdminPromotionsPage initialPromotions={promotions} initialStats={stats} />;
}
