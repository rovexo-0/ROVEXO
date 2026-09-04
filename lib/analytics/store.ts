import { createClient } from "@/lib/supabase/server";
import { buildDashboardPerformance } from "@/lib/dashboard/utils";
import { getSellerPromotionAnalytics } from "@/lib/promotions/analytics";
import type {
  AnalyticsDateRange,
  AnalyticsTopProduct,
  BusinessAnalyticsChartPoint,
  BusinessAnalyticsData,
  BusinessAnalyticsMetric,
  SellerAnalyticsData,
} from "@/lib/analytics/types";
import {
  BUSINESS_ANALYTICS_CAPABILITIES,
  bucketByLondonDay,
  computeAverageSale,
  computeConversionRate,
  computePeriodDelta,
  formatBusinessGbp,
  formatBusinessPercent,
  formatBusinessSaleDate,
  inInclusiveWindow,
  isEligibleBusinessSale,
  listingHrefFromSlug,
  resolveBusinessAnalyticsWindow,
  resolvePriorBusinessAnalyticsWindow,
  type BusinessAnalyticsPeriodId,
} from "@/lib/analytics/business-analytics-v1";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import { ANALYTICS_DATE_RANGES } from "@/lib/analytics/types";
import {
  normalizeSellerContext,
  type SellerContext,
} from "@/lib/seller-context/seller-context-v1";

function rangeStart(range: AnalyticsDateRange): string {
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function rangeLabel(range: AnalyticsDateRange): string {
  return ANALYTICS_DATE_RANGES.find((entry) => entry.id === range)?.label ?? "30 Days";
}

function bucketCountForRange(range: AnalyticsDateRange): number {
  if (range === "7d") return 7;
  if (range === "30d") return 6;
  if (range === "90d") return 8;
  return 12;
}

function buildPerformanceFromOrders(
  orders: Array<{ total: number; created_at: string }>,
  range: AnalyticsDateRange,
) {
  const bucketCount = bucketCountForRange(range);
  const start = new Date(rangeStart(range)).getTime();
  const span = Math.max(1, Date.now() - start);
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: range === "7d" ? `D${index + 1}` : `W${index + 1}`,
    values: { revenue: 0, views: 0, orders: 0 },
  }));

  for (const order of orders) {
    const time = new Date(order.created_at).getTime();
    const index = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(((time - start) / span) * bucketCount)),
    );
    buckets[index].values.revenue += Number(order.total);
    buckets[index].values.orders += 1;
  }

  return buildDashboardPerformance(
    buckets,
    [
      { id: "revenue", label: "Revenue", format: "currency" },
      { id: "views", label: "Views", format: "number" },
      { id: "orders", label: "Orders", format: "number" },
    ],
    rangeLabel(range),
  );
}

type OrderAnalyticsRow = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address_id: string | null;
  seller_context?: string | null;
};

async function loadSellerOrders(
  userId: string,
  since: string,
  sellerContext?: SellerContext,
): Promise<OrderAnalyticsRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, total, status, created_at, shipping_address_id, seller_context")
    .eq("seller_id", userId)
    .gte("created_at", since);

  if (sellerContext === "business") {
    query = query.eq("seller_context", "business");
  } else if (sellerContext === "individual") {
    query = query.or("seller_context.eq.individual,seller_context.is.null");
  }

  const { data } = await query;
  return (data as OrderAnalyticsRow[] | null) ?? [];
}

async function loadTopProductsFromOrders(
  orders: OrderAnalyticsRow[],
): Promise<AnalyticsTopProduct[]> {
  const completed = orders.filter((order) => order.status !== "cancelled");
  if (completed.length === 0) return [];

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, product_id, title, image_url, price, quantity")
    .in(
      "order_id",
      completed.map((order) => order.id),
    );

  const byProduct = new Map<
    string,
    { title: string; imageUrl: string; revenue: number; orders: number }
  >();

  for (const item of items ?? []) {
    const id = item.product_id ?? item.title;
    const quantity = Number(item.quantity ?? 1);
    const current = byProduct.get(id) ?? {
      title: item.title,
      imageUrl: item.image_url ?? "",
      revenue: 0,
      orders: 0,
    };
    current.revenue += Number(item.price) * quantity;
    current.orders += 1;
    byProduct.set(id, current);
  }

  return [...byProduct.entries()]
    .map(([id, product]) => ({
      id,
      title: product.title,
      imageUrl: product.imageUrl,
      revenue: product.revenue,
      orders: product.orders,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

type BusinessOrderRow = {
  id: string;
  status: string;
  created_at: string;
  seller_context: string | null;
  refunded_at: string | null;
  refund_status: string | null;
  stripe_refund_id: string | null;
  refunded_amount: number | null;
};

type BusinessOrderItemRow = {
  order_id: string;
  product_id: string | null;
  title: string;
  image_url: string | null;
  price: number;
  quantity: number;
  slug: string | null;
};

function metric(input: {
  id: string;
  label: string;
  value: number | null;
  display: string;
  format: BusinessAnalyticsMetric["format"];
  deltaPercent: number | null;
  priorLabel: string;
}): BusinessAnalyticsMetric {
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    display: input.display,
    format: input.format,
    deltaPercent: input.deltaPercent,
    deltaLabel: input.deltaPercent == null ? null : input.priorLabel,
  };
}

function emptyMetric(
  id: string,
  label: string,
  priorLabel: string,
): BusinessAnalyticsMetric {
  return metric({
    id,
    label,
    value: null,
    display: "—",
    format: "unavailable",
    deltaPercent: null,
    priorLabel,
  });
}

function emptyChart(title: string, points: BusinessAnalyticsChartPoint[]): BusinessAnalyticsData["sales"]["chart"] {
  return { title, total: 0, totalLabel: title === "Sales" ? formatBusinessGbp(0) : "0 Views", points };
}

function emptyBusinessAnalyticsData(
  period: BusinessAnalyticsPeriodId,
  identity: BusinessAnalyticsData["identity"],
  isolated: boolean,
  listingViewsAvailable: boolean,
): BusinessAnalyticsData {
  const window = resolveBusinessAnalyticsWindow({ period });
  const zeroPoints = bucketByLondonDay([], window.dayKeys);
  return {
    period,
    periodLabel: window.label,
    rangeStart: window.startIso,
    rangeEnd: window.endIso,
    identity,
    isolated,
    capabilities: {
      ...BUSINESS_ANALYTICS_CAPABILITIES,
      listingViews: listingViewsAvailable,
    },
    sales: {
      overview: {
        sales: metric({
          id: "sales",
          label: "Sales",
          value: 0,
          display: formatBusinessGbp(0),
          format: "currency",
          deltaPercent: null,
          priorLabel: window.priorLabel,
        }),
        orders: metric({
          id: "orders",
          label: "Orders",
          value: 0,
          display: "0",
          format: "number",
          deltaPercent: null,
          priorLabel: window.priorLabel,
        }),
        quantitySold: metric({
          id: "quantity-sold",
          label: "Quantity Sold",
          value: 0,
          display: "0",
          format: "number",
          deltaPercent: null,
          priorLabel: window.priorLabel,
        }),
        averageSale: emptyMetric("average-sale", "Average Sale", window.priorLabel),
      },
      chart: emptyChart("Sales", zeroPoints),
      topProducts: [],
      recentSales: [],
    },
    traffic: {
      overview: {
        listingViews: listingViewsAvailable
          ? metric({
              id: "listing-views",
              label: "Listing Views",
              value: 0,
              display: "0",
              format: "number",
              deltaPercent: null,
              priorLabel: window.priorLabel,
            })
          : emptyMetric("listing-views", "Listing Views", window.priorLabel),
        quantitySold: metric({
          id: "traffic-quantity-sold",
          label: "Quantity Sold",
          value: 0,
          display: "0",
          format: "number",
          deltaPercent: null,
          priorLabel: window.priorLabel,
        }),
        clickThroughRate: emptyMetric(
          "click-through-rate",
          "Click-through Rate",
          window.priorLabel,
        ),
        conversionRate: emptyMetric("conversion-rate", "Conversion Rate", window.priorLabel),
      },
      chart: {
        title: "Listing Views",
        total: listingViewsAvailable ? 0 : null,
        totalLabel: listingViewsAvailable ? "0 Views" : "Unavailable",
        points: zeroPoints,
      },
    },
  };
}

async function loadBusinessOrdersSince(
  userId: string,
  sinceIso: string,
): Promise<BusinessOrderRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, seller_context, refunded_at, refund_status, stripe_refund_id, refunded_amount",
    )
    .eq("seller_id", userId)
    .eq("seller_context", "business")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  return (data as BusinessOrderRow[] | null) ?? [];
}

async function loadBusinessOrderItems(orderIds: string[]): Promise<BusinessOrderItemRow[]> {
  if (orderIds.length === 0) return [];
  const supabase = await createClient();
  const items: BusinessOrderItemRow[] = [];
  for (let i = 0; i < orderIds.length; i += 100) {
    const chunk = orderIds.slice(i, i + 100);
    const { data } = await supabase
      .from("order_items")
      .select("order_id, product_id, title, image_url, price, quantity, slug")
      .in("order_id", chunk);
    items.push(...((data as BusinessOrderItemRow[] | null) ?? []));
  }
  return items;
}

async function loadListingViewTimes(
  productIds: string[],
  sinceIso: string,
  untilIso: string,
): Promise<{ available: boolean; times: string[] }> {
  if (productIds.length === 0) return { available: true, times: [] };
  const admin = tryCreateAdminClient();
  if (!admin) return { available: false, times: [] };

  const times: string[] = [];
  for (let i = 0; i < productIds.length; i += 80) {
    const chunk = productIds.slice(i, i + 80);
    for (let page = 0; page < 20; page += 1) {
      const from = page * 1000;
      const { data, error } = await admin
        .from("product_view_events")
        .select("created_at")
        .in("product_id", chunk)
        .gte("created_at", sinceIso)
        .lte("created_at", untilIso)
        .order("created_at", { ascending: true })
        .range(from, from + 999);
      if (error) return { available: false, times: [] };
      const rows = data ?? [];
      times.push(...rows.map((row) => row.created_at));
      if (rows.length < 1000) break;
    }
  }
  return { available: true, times };
}

export async function getSellerAnalyticsData(
  userId: string,
  range: AnalyticsDateRange = "30d",
  sellerContext?: SellerContext,
  preloadedOrders?: OrderAnalyticsRow[],
): Promise<SellerAnalyticsData> {
  const supabase = await createClient();
  const since = rangeStart(range);
  const context = sellerContext ? normalizeSellerContext(sellerContext) : undefined;

  const [orders, { data: products }, promotionAnalytics] = await Promise.all([
    preloadedOrders
      ? Promise.resolve(preloadedOrders)
      : loadSellerOrders(userId, since, context),
    supabase.from("products").select("id, title, views, likes").eq("seller_id", userId),
    getSellerPromotionAnalytics(userId, since),
  ]);

  const productIds = (products ?? []).map((product) => product.id);
  const [{ count: saves }, { count: reviews }] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from("saved_items")
          .select("*", { count: "exact", head: true })
          .in("product_id", productIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("reviewee_id", userId)
      .gte("created_at", since),
  ]);

  const completed = orders.filter((order) => order.status !== "cancelled");
  const revenue = completed.reduce((sum, order) => sum + Number(order.total), 0);
  const views =
    context === "business" ? 0 : (products?.reduce((sum, product) => sum + product.views, 0) ?? 0);
  const topProducts = await loadTopProductsFromOrders(orders);

  return {
    range,
    rangeLabel: rangeLabel(range),
    overview: [
      { label: "Revenue", value: revenue, format: "currency" },
      { label: "Orders", value: completed.length, format: "number" },
      { label: "Views", value: views, format: "number" },
      {
        label: "Conversion",
        value: views > 0 ? Number(((completed.length / views) * 100).toFixed(1)) : 0,
        format: "percent",
      },
      {
        label: "Promo CTR",
        value: context === "business" ? 0 : promotionAnalytics.ctr,
        format: "percent",
      },
      {
        label: "Promo revenue",
        value: context === "business" ? 0 : promotionAnalytics.revenueCents / 100,
        format: "currency",
      },
    ],
    performance: buildPerformanceFromOrders(completed, range),
    topProducts,
    trafficSources: [],
    recentActivity: {
      reviews: reviews ?? 0,
      saves: saves ?? 0,
    },
    promotions: context === "business" ? undefined : promotionAnalytics,
  };
}

export async function getBusinessAnalyticsData(
  userId: string,
  period: BusinessAnalyticsPeriodId = "30d",
  custom?: { from?: string | null; to?: string | null },
): Promise<BusinessAnalyticsData> {
  const supabase = await createClient();
  const window = resolveBusinessAnalyticsWindow({
    period,
    customFrom: custom?.from,
    customTo: custom?.to,
  });
  const prior = resolvePriorBusinessAnalyticsWindow(window);

  const [contextResult, businessResult, profileResult, productsResult] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("active_seller_context")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("business_accounts").select("business_name").eq("id", userId).maybeSingle(),
    supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
    supabase
      .from("products")
      .select("id, slug")
      .eq("seller_id", userId)
      .neq("status", "deleted"),
  ]);

  const businessAccount = businessResult.data;
  const profileRow = profileResult.data;
  const products = productsResult.data ?? [];

  const identity = {
    businessName:
      (businessAccount?.business_name ?? "").trim() ||
      (profileRow?.full_name ?? "").trim() ||
      "Business",
    avatarUrl: normalizeAvatarUrl(profileRow?.avatar_url ?? null),
  };

  const isolated =
    normalizeSellerContext(contextResult.data?.active_seller_context) === "business";

  if (!isolated) {
    return emptyBusinessAnalyticsData(period, identity, false, true);
  }

  const productIds = products.map((product) => product.id);
  const slugByProductId = new Map(
    products.map((product) => [product.id, product.slug as string | null]),
  );

  const [orders, views] = await Promise.all([
    loadBusinessOrdersSince(userId, prior.startIso),
    loadListingViewTimes(productIds, prior.startIso, window.endIso),
  ]);

  const eligible = orders.filter(isEligibleBusinessSale);
  const items = await loadBusinessOrderItems(eligible.map((order) => order.id));
  const itemsByOrder = new Map<string, BusinessOrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const currentOrders = eligible.filter((order) =>
    inInclusiveWindow(order.created_at, window.start, window.end),
  );
  const priorOrders = eligible.filter((order) =>
    inInclusiveWindow(order.created_at, prior.start, prior.end),
  );

  const sumItems = (orderList: BusinessOrderRow[]) => {
    let sales = 0;
    let quantity = 0;
    for (const order of orderList) {
      for (const item of itemsByOrder.get(order.id) ?? []) {
        const qty = Number(item.quantity ?? 1);
        sales += Number(item.price ?? 0) * qty;
        quantity += qty;
      }
    }
    return { sales, quantity, orders: orderList.length };
  };

  const current = sumItems(currentOrders);
  const previous = sumItems(priorOrders);
  const averageSale = computeAverageSale(current.sales, current.orders);
  const priorAverage = computeAverageSale(previous.sales, previous.orders);

  const currentViewTimes = views.times.filter((iso) =>
    inInclusiveWindow(iso, window.start, window.end),
  );
  const priorViewTimes = views.times.filter((iso) =>
    inInclusiveWindow(iso, prior.start, prior.end),
  );
  const listingViews = views.available ? currentViewTimes.length : null;
  const priorViews = views.available ? priorViewTimes.length : null;
  const conversion = listingViews == null ? null : computeConversionRate(current.quantity, listingViews);
  const priorConversion =
    priorViews == null ? null : computeConversionRate(previous.quantity, priorViews);

  const currentSaleLines = currentOrders.flatMap((order) =>
    (itemsByOrder.get(order.id) ?? []).map((item) => ({
      at: order.created_at,
      amount: Number(item.price ?? 0) * Number(item.quantity ?? 1),
    })),
  );
  const salesPoints = bucketByLondonDay(
    currentSaleLines.map((line) => line.at),
    window.dayKeys,
    (index) => currentSaleLines[index]?.amount ?? 0,
  );

  const viewPoints = bucketByLondonDay(currentViewTimes, window.dayKeys);

  const byProduct = new Map<
    string,
    { title: string; imageUrl: string; qtySold: number; sales: number; slug: string | null }
  >();
  for (const order of currentOrders) {
    for (const item of itemsByOrder.get(order.id) ?? []) {
      const id = item.product_id ?? item.slug ?? item.title;
      const qty = Number(item.quantity ?? 1);
      const currentProduct = byProduct.get(id) ?? {
        title: item.title,
        imageUrl: item.image_url ?? "",
        qtySold: 0,
        sales: 0,
        slug: item.slug ?? slugByProductId.get(item.product_id ?? "") ?? null,
      };
      currentProduct.qtySold += qty;
      currentProduct.sales += Number(item.price ?? 0) * qty;
      byProduct.set(id, currentProduct);
    }
  }

  const topProducts = [...byProduct.entries()]
    .map(([id, product]) => ({
      id,
      title: product.title,
      imageUrl: product.imageUrl,
      qtySold: product.qtySold,
      sales: product.sales,
      href: listingHrefFromSlug(product.slug, id),
    }))
    .sort((a, b) => b.qtySold - a.qtySold || b.sales - a.sales)
    .slice(0, 5);

  const recentSales = currentOrders.slice(0, 8).flatMap((order) => {
    const lines = itemsByOrder.get(order.id) ?? [];
    return lines.map((item, index) => ({
      id: `${order.id}:${item.product_id ?? index}`,
      orderId: order.id,
      title: item.title,
      imageUrl: item.image_url ?? "",
      amount: Number(item.price ?? 0) * Number(item.quantity ?? 1),
      soldAt: order.created_at,
      dateLabel: formatBusinessSaleDate(order.created_at),
      href: `/orders/${encodeURIComponent(order.id)}?returnTo=${encodeURIComponent("/business/analytics")}`,
    }));
  }).slice(0, 5);

  return {
    period,
    periodLabel: window.label,
    rangeStart: window.startIso,
    rangeEnd: window.endIso,
    identity,
    isolated: true,
    capabilities: {
      ...BUSINESS_ANALYTICS_CAPABILITIES,
      listingViews: views.available,
    },
    sales: {
      overview: {
        sales: metric({
          id: "sales",
          label: "Sales",
          value: current.sales,
          display: formatBusinessGbp(current.sales),
          format: "currency",
          deltaPercent: computePeriodDelta(current.sales, previous.sales),
          priorLabel: window.priorLabel,
        }),
        orders: metric({
          id: "orders",
          label: "Orders",
          value: current.orders,
          display: String(current.orders),
          format: "number",
          deltaPercent: computePeriodDelta(current.orders, previous.orders),
          priorLabel: window.priorLabel,
        }),
        quantitySold: metric({
          id: "quantity-sold",
          label: "Quantity Sold",
          value: current.quantity,
          display: String(current.quantity),
          format: "number",
          deltaPercent: computePeriodDelta(current.quantity, previous.quantity),
          priorLabel: window.priorLabel,
        }),
        averageSale: metric({
          id: "average-sale",
          label: "Average Sale",
          value: averageSale,
          display: averageSale == null ? "—" : formatBusinessGbp(averageSale),
          format: averageSale == null ? "unavailable" : "currency",
          deltaPercent:
            averageSale == null || priorAverage == null
              ? null
              : computePeriodDelta(averageSale, priorAverage),
          priorLabel: window.priorLabel,
        }),
      },
      chart: {
        title: "Sales",
        total: current.sales,
        totalLabel: formatBusinessGbp(current.sales),
        points: salesPoints,
      },
      topProducts,
      recentSales,
    },
    traffic: {
      overview: {
        listingViews: views.available
          ? metric({
              id: "listing-views",
              label: "Listing Views",
              value: listingViews,
              display: String(listingViews ?? 0),
              format: "number",
              deltaPercent:
                listingViews == null || priorViews == null
                  ? null
                  : computePeriodDelta(listingViews, priorViews),
              priorLabel: window.priorLabel,
            })
          : emptyMetric("listing-views", "Listing Views", window.priorLabel),
        quantitySold: metric({
          id: "traffic-quantity-sold",
          label: "Quantity Sold",
          value: current.quantity,
          display: String(current.quantity),
          format: "number",
          deltaPercent: computePeriodDelta(current.quantity, previous.quantity),
          priorLabel: window.priorLabel,
        }),
        clickThroughRate: emptyMetric(
          "click-through-rate",
          "Click-through Rate",
          window.priorLabel,
        ),
        conversionRate:
          conversion == null
            ? emptyMetric("conversion-rate", "Conversion Rate", window.priorLabel)
            : metric({
                id: "conversion-rate",
                label: "Conversion Rate",
                value: conversion,
                display: formatBusinessPercent(conversion),
                format: "percent",
                deltaPercent:
                  conversion == null || priorConversion == null
                    ? null
                    : computePeriodDelta(conversion, priorConversion),
                priorLabel: window.priorLabel,
              }),
      },
      chart: {
        title: "Listing Views",
        total: listingViews,
        totalLabel:
          listingViews == null ? "Unavailable" : `${listingViews} Views`,
        points: views.available ? viewPoints : bucketByLondonDay([], window.dayKeys),
      },
    },
  };
}
