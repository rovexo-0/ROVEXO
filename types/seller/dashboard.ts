import type { DashboardPerformance, DashboardRecentOrder } from "@/features/dashboard/types";
import type { SellerShippingSettings } from "@/lib/seller/shipping-settings";
import type { Conversation } from "@/lib/messages/types";
import type { Notification } from "@/lib/notifications/types";
import type { Order } from "@/lib/orders/types";
import type {
  ActiveSellerPromotion,
  SellerDashboardData as SellerCoreDashboardData,
} from "@/lib/seller/types";
import type { SellerPromotionHistoryItem, SellerPromotionStats } from "@/lib/promotions/types";
import type { SellerAnalyticsData } from "@/lib/analytics/types";
import type { WalletData } from "@/lib/wallet/types";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { RovexoIconRef } from "@/lib/icons/types";
import type { SellerListing } from "@/lib/listings/types";

export type SellerQuickAction = {
  id: string;
  title: string;
  href: string;
  icon: RovexoIconRef;
  count?: number;
};

export type SellerStatistics = {
  activeListings: number;
  soldItems: number;
  orders: number;
  revenue: number;
  pendingPayout: number;
  followers: number;
  views: number;
  favorites: number;
  conversionRate: number;
  storeScore: number;
};

export type SellerListingBreakdown = {
  active: number;
  draft: number;
  pendingApproval: number;
  rejected: number;
  expired: number;
  sold: number;
  boosted: number;
};

export type SellerOrderBreakdown = {
  new: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returns: number;
  refundRequests: number;
};

export type SellerReviewsSummary = {
  averageRating: number;
  reviewCount: number;
  pendingResponses: number;
};

export type SellerMessagesSummary = {
  unread: number;
  buyerQuestions: number;
  offers: number;
  negotiations: number;
  preview: Conversation[];
};

export type SellerNotificationGroups = {
  orders: number;
  payments: number;
  reviews: number;
  platform: number;
  security: number;
  latest: Notification[];
};

export type SellerPromotionSummary = {
  activeCount: number;
  featuredCount: number;
  bumpCount: number;
  stats: SellerPromotionStats;
  history: SellerPromotionHistoryItem[];
  active: ActiveSellerPromotion[];
  /** Future Promote Engine hook */
  campaignStatus: "ready" | "inactive";
};

export type SellerSubscriptionSummary = {
  planLabel: string;
  status: "active" | "inactive" | "trial";
  href: string;
};

export type SellerSettingsLink = {
  id: string;
  label: string;
  href: string;
  icon: RovexoIconRef;
};

export type SellerStoreSummary = {
  storeName: string;
  storeHref: string;
  description: string;
  returnPolicyDays: number;
  verified: boolean;
};

export type SellerAnalyticsSummary = {
  rangeLabel: string;
  revenue: number;
  views: number;
  ctr: number;
  conversion: number;
  visitors: number;
  sales: number;
  topListings: SellerAnalyticsData["topProducts"];
  topCategories: Array<{ id: string; label: string; value: number }>;
  performance: DashboardPerformance;
};

export type SellerDashboardData = SellerCoreDashboardData & {
  trust: TrustDashboardData | null;
  statistics: SellerStatistics;
  listingBreakdown: SellerListingBreakdown;
  orderBreakdown: SellerOrderBreakdown;
  orders: Order[];
  draftListings: SellerListing[];
  wallet: WalletData;
  shipping: SellerShippingSettings;
  reviews: SellerReviewsSummary;
  messages: SellerMessagesSummary;
  notifications: SellerNotificationGroups;
  promotion: SellerPromotionSummary;
  subscription: SellerSubscriptionSummary;
  store: SellerStoreSummary;
  analytics: SellerAnalyticsSummary;
  quickActions: SellerQuickAction[];
  settingsLinks: SellerSettingsLink[];
  recentActivity: DashboardRecentOrder[];
  sellerRank: string;
  storeName: string;
  activeSince: string;
};
