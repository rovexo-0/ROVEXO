import { UserPromotionsAdmin } from "@/features/super-admin/promotion-management/UserPromotionsAdmin";
import { ADMIN_DURATION_OPTIONS } from "@/lib/promotions/admin-engine";

export default function SuperAdminPromotionManagementPage() {
  return <UserPromotionsAdmin durationOptions={ADMIN_DURATION_OPTIONS} />;
}
