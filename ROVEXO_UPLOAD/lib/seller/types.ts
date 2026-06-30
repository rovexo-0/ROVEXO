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

import type { SellerMigrationSummary } from "@/lib/seller/migration/types";

export type SellerDashboardData = {
  profile: UserProfile;
  sellerRating: number;
  reviewCount: number;
  activeListings: number;
  lowStockCount: number;
  activePromotions: ActiveSellerPromotion[];
  promotionStats: SellerPromotionStats;
  promotionHistory: SellerPromotionHistoryItem[];
  followers: number;
  profileViews: number;
  responseTimeMinutes: number;
  conversionRate: number;
  featuredCount: number;
  bumpCount: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  todaySummary: DashboardSummaryCard[];
  performance: DashboardPerformance;
  recentOrders: DashboardRecentOrder[];
  migrationSummary: SellerMigrationSummary | null;
};
