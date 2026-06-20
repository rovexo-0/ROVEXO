import type {
  DashboardPerformance,
  DashboardRecentOrder,
  DashboardSummaryCard,
} from "@/features/dashboard/types";
import type { PromotionType } from "@/lib/promotions/config";
import type {
  SellerPromotionHistoryItem,
  SellerPromotionStats,
} from "@/lib/promotions/types";
import type { UserProfile } from "@/lib/profile/types";

export type ActiveSellerPromotion = {
  productId: string;
  title: string;
  imageUrl: string;
  type: PromotionType;
  endsAt: string;
};

export type SellerDashboardData = {
  profile: UserProfile;
  sellerRating: number;
  reviewCount: number;
  activeListings: number;
  lowStockCount: number;
  activePromotions: ActiveSellerPromotion[];
  promotionStats: SellerPromotionStats;
  promotionHistory: SellerPromotionHistoryItem[];
  todaySummary: DashboardSummaryCard[];
  performance: DashboardPerformance;
  recentOrders: DashboardRecentOrder[];
};
