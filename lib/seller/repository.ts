import { getSellerListings } from "@/lib/listings/repository";
import type { SellerListing } from "@/lib/listings/types";
import { listConversations } from "@/lib/messages/store";
import { listNotifications } from "@/lib/notifications/store";
import { fetchOrdersForUser } from "@/lib/orders/queries";
import type { Order } from "@/lib/orders/types";
import { getSellerAnalyticsData } from "@/lib/analytics/store";
import { getSellerDashboardData } from "@/lib/seller/dashboard";
import { getSellerShippingSettings } from "@/lib/seller/shipping-settings";
import { DEFAULT_SELLER_LABEL_SIZE } from "@/lib/shipping/label-size";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { getTrustDashboardData } from "@/lib/trust/service";
import { getWalletData } from "@/lib/wallet/store";
import type { UserProfile } from "@/lib/profile/types";
import {
  buildSellerQuickActions,
  SELLER_NEW_ORDER_STATUSES,
  SELLER_PROCESSING_ORDER_STATUSES,
  SELLER_RETURN_ORDER_STATUSES,
  SELLER_SETTINGS_LINKS,
  SELLER_SUBSCRIPTION_PLACEHOLDER,
} from "@/lib/seller/constants";
import type {
  SellerAnalyticsSummary,
  SellerDashboardData,
  SellerListingBreakdown,
  SellerMessagesSummary,
  SellerNotificationGroups,
  SellerOrderBreakdown,
  SellerPromotionSummary,
  SellerReviewsSummary,
  SellerStatistics,
  SellerStoreSummary,
} from "@/types/seller";

function buildListingBreakdown(
  listings: SellerListing[],
  boosted: number,
): SellerListingBreakdown {
  return {
    active: listings.filter((listing) => listing.status === "published" && listing.stock > 0).length,
    draft: listings.filter((listing) => listing.status === "draft").length,
    pendingApproval: listings.filter((listing) => listing.status === "paused").length,
    rejected: 0,
    expired: listings.filter((listing) => listing.status === "paused").length,
    sold: listings.filter((listing) => listing.status === "sold").length,
    boosted,
  };
}

function buildOrderBreakdown(orders: Order[]): SellerOrderBreakdown {
  return {
    new: orders.filter((order) => SELLER_NEW_ORDER_STATUSES.has(order.status)).length,
    processing: orders.filter((order) => SELLER_PROCESSING_ORDER_STATUSES.has(order.status)).length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    delivered: orders.filter((order) => order.status === "delivered" || order.status === "completed").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
    returns: orders.filter((order) => SELLER_RETURN_ORDER_STATUSES.has(order.status)).length,
    refundRequests: orders.filter((order) => order.status === "issue_open").length,
  };
}

function buildStatistics(input: {
  core: Awaited<ReturnType<typeof getSellerDashboardData>>;
  orders: Order[];
  walletPending: number;
  favorites: number;
}): SellerStatistics {
  return {
    activeListings: input.core.activeListings,
    soldItems: input.orders.filter((order) => order.status === "completed" || order.status === "delivered").length,
    orders: input.orders.length,
    revenue: input.core.monthlyRevenue,
    pendingPayout: input.walletPending,
    followers: input.core.followers,
    views: input.core.profileViews,
    favorites: input.favorites,
    conversionRate: input.core.conversionRate,
    storeScore: input.core.sellerRating,
  };
}

function buildReviewsSummary(
  rating: number,
  reviewCount: number,
): SellerReviewsSummary {
  return {
    averageRating: rating,
    reviewCount,
    pendingResponses: 0,
  };
}

function buildMessagesSummary(conversations: Awaited<ReturnType<typeof listConversations>>): SellerMessagesSummary {
  const unread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);
  return {
    unread,
    buyerQuestions: conversations.length,
    offers: 0,
    negotiations: 0,
    preview: conversations.slice(0, 4),
  };
}

function buildNotificationGroups(notifications: Awaited<ReturnType<typeof listNotifications>>): SellerNotificationGroups {
  const unread = notifications.filter((item) => !item.read);
  return {
    orders: unread.filter((item) => item.type === "order").length,
    payments: unread.filter((item) => item.type === "payment").length,
    reviews: unread.filter((item) => item.type === "review").length,
    platform: unread.filter((item) =>
      ["system", "moderation", "promotion_expired", "saved_search_match"].includes(item.type),
    ).length,
    security: unread.filter((item) => item.type === "system").length,
    latest: notifications.slice(0, 5),
  };
}

function buildPromotionSummary(core: Awaited<ReturnType<typeof getSellerDashboardData>>): SellerPromotionSummary {
  return {
    activeCount: core.activePromotions.length,
    featuredCount: core.featuredCount,
    bumpCount: core.bumpCount,
    stats: core.promotionStats,
    history: core.promotionHistory,
    active: core.activePromotions,
    campaignStatus: core.activePromotions.length > 0 ? "ready" : "inactive",
  };
}

function buildStoreSummary(
  profile: UserProfile,
  shipping: Awaited<ReturnType<typeof getSellerShippingSettings>>,
): SellerStoreSummary {
  return {
    storeName: profile.fullName,
    storeHref: `/user/${profile.username}`,
    description: `Seller store by @${profile.username}`,
    returnPolicyDays: shipping.returnPolicyDays,
    verified: profile.verified,
  };
}

function buildAnalyticsSummary(
  core: Awaited<ReturnType<typeof getSellerDashboardData>>,
  analytics: Awaited<ReturnType<typeof getSellerAnalyticsData>>,
): SellerAnalyticsSummary {
  const revenue = analytics.overview.find((metric) => metric.label === "Revenue");
  const views = analytics.overview.find((metric) => metric.label === "Views");
  const conversion = analytics.overview.find((metric) => metric.label === "Conversion");
  const orders = analytics.overview.find((metric) => metric.label === "Orders");

  return {
    rangeLabel: analytics.rangeLabel,
    revenue: Number(revenue?.value ?? core.monthlyRevenue),
    views: Number(views?.value ?? core.profileViews),
    ctr: analytics.promotions?.ctr ?? 0,
    conversion: Number(conversion?.value ?? core.conversionRate),
    visitors: Number(views?.value ?? core.profileViews),
    sales: Number(orders?.value ?? core.monthlyOrders),
    topListings: analytics.topProducts,
    topCategories: analytics.trafficSources.map((segment) => ({
      id: segment.id,
      label: segment.label,
      value: segment.value,
    })),
    performance: analytics.performance,
  };
}

export async function fetchSellerDashboardRepository(
  profile: UserProfile,
): Promise<SellerDashboardData> {
  const sellerId = profile.id;

  const [
    coreResult,
    trustResult,
    ordersResult,
    listingsResult,
    walletResult,
    shippingResult,
    conversationsResult,
    notificationsResult,
    analyticsResult,
  ] = await Promise.allSettled([
    getSellerDashboardData(sellerId),
    getTrustDashboardData(sellerId, profile.verified),
    fetchOrdersForUser(sellerId, "seller"),
    getSellerListings(sellerId, "all"),
    getWalletData(sellerId),
    getSellerShippingSettings(sellerId),
    listConversations(sellerId),
    listNotifications(sellerId),
    getSellerAnalyticsData(sellerId, "30d"),
  ]);

  const core = coreResult.status === "fulfilled" ? coreResult.value : await getSellerDashboardData(sellerId);
  const trust = trustResult.status === "fulfilled" ? trustResult.value : null;
  const orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  const listings = listingsResult.status === "fulfilled" ? listingsResult.value : [];
  const wallet = walletResult.status === "fulfilled"
    ? walletResult.value
    : {
        availableBalance: 0,
        pendingBalance: 0,
        pendingAvailableAt: new Date().toISOString(),
        paidOutBalance: 0,
        monthSummary: {
          revenue: { value: 0, changePercent: 0 },
          withdrawn: { value: 0, changePercent: 0 },
          fees: { value: 0, changePercent: 0 },
        },
        transactions: [],
        withdrawMethods: [],
        connectStatus: { connected: false, payoutsEnabled: false },
      };
  const shipping = shippingResult.status === "fulfilled" ? shippingResult.value : {
    handlingTimeDays: 1,
    dispatchTimeDays: 1,
    baseShippingCost: 0,
    freeShippingThreshold: null,
    defaultCarrier: "Royal Mail",
    defaultLabelSize: DEFAULT_SELLER_LABEL_SIZE,
    shipsTo: UK_DEFAULT_COUNTRY,
    localPickupEnabled: false,
    internationalShippingEnabled: false,
    returnPolicyDays: 14,
  };
  const conversations = conversationsResult.status === "fulfilled" ? conversationsResult.value : [];
  const notifications = notificationsResult.status === "fulfilled" ? notificationsResult.value : [];
  const analytics = analyticsResult.status === "fulfilled"
    ? analyticsResult.value
    : await getSellerAnalyticsData(sellerId, "30d");

  const listingBreakdown = buildListingBreakdown(listings, core.featuredCount + core.bumpCount);
  const orderBreakdown = buildOrderBreakdown(orders);
  const draftListings = listings.filter((listing) => listing.status === "draft").slice(0, 4);
  const favorites = listings.reduce((sum, listing) => sum + listing.likes, 0);
  const statistics = buildStatistics({
    core,
    orders,
    walletPending: wallet.pendingBalance,
    favorites,
  });

  const unreadMessages = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

  return {
    ...core,
    trust,
    statistics,
    listingBreakdown,
    orderBreakdown,
    orders,
    draftListings,
    wallet,
    shipping,
    reviews: buildReviewsSummary(core.sellerRating, core.reviewCount),
    messages: buildMessagesSummary(conversations),
    notifications: buildNotificationGroups(notifications),
    promotion: buildPromotionSummary(core),
    subscription: {
      planLabel: SELLER_SUBSCRIPTION_PLACEHOLDER.planLabel,
      status: SELLER_SUBSCRIPTION_PLACEHOLDER.status,
      href: SELLER_SUBSCRIPTION_PLACEHOLDER.href,
    },
    store: buildStoreSummary(profile, shipping),
    analytics: buildAnalyticsSummary(core, analytics),
    quickActions: buildSellerQuickActions({
      listings: listingBreakdown.active,
      orders: orderBreakdown.new,
      messages: unreadMessages,
    }),
    settingsLinks: SELLER_SETTINGS_LINKS,
    recentActivity: core.recentOrders,
    sellerRank: trust?.progress.current ?? "Member",
    storeName: profile.fullName,
    activeSince: profile.memberSince,
  };
}
