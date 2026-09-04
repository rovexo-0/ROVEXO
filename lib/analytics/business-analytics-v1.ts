/**
 * ROVEXO Business Analytics v1 — canonical formulas and period bounds.
 * Client-safe. No server/session imports.
 *
 * Conversion Rate = Quantity Sold / Listing Views × 100
 *   only when Listing Views > 0 (both numerator and denominator are real).
 *
 * Click-through Rate is not calculable: ROVEXO has no listing impression
 * denominator (product_view_events is the view/click-through event itself).
 *
 * Traffic sources and search keywords are not recorded on view events.
 */

export const BUSINESS_ANALYTICS_TZ = "Europe/London" as const;
export const BUSINESS_ANALYTICS_VERSION = "1.0" as const;

export const BUSINESS_ANALYTICS_PERIODS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "custom", label: "Custom" },
] as const;

export type BusinessAnalyticsPeriodId = (typeof BUSINESS_ANALYTICS_PERIODS)[number]["id"];

export type BusinessAnalyticsWindow = {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  label: string;
  priorLabel: string;
  dayKeys: string[];
};

export const BUSINESS_ANALYTICS_INELIGIBLE_STATUSES = [
  "cancelled",
  "awaiting_payment",
] as const;

export type BusinessAnalyticsOrderLike = {
  status: string;
  seller_context?: string | null;
  refunded_at?: string | null;
  refund_status?: string | null;
  stripe_refund_id?: string | null;
  refunded_amount?: number | null;
};

export function isBusinessAnalyticsPeriodId(value: unknown): value is BusinessAnalyticsPeriodId {
  return (
    value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "90d" ||
    value === "custom"
  );
}

export function formatBusinessGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatBusinessPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatBusinessDateLabel(isoOrKey: string): string {
  const date = isoOrKey.length === 10 ? new Date(`${isoOrKey}T12:00:00.000Z`) : new Date(isoOrKey);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_ANALYTICS_TZ,
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatBusinessSaleDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_ANALYTICS_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function londonDateKey(input: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_ANALYTICS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(input);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function londonOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_ANALYTICS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  );
  return asUtc - instant.getTime();
}

export function startOfLondonDay(dateKey: string): Date {
  const utcGuess = new Date(`${dateKey}T00:00:00.000Z`);
  const first = new Date(utcGuess.getTime() - londonOffsetMs(utcGuess));
  if (londonDateKey(first) === dateKey) return first;
  const second = new Date(first.getTime() + (first.getTime() > utcGuess.getTime() ? -3_600_000 : 3_600_000));
  return londonDateKey(second) === dateKey ? second : first;
}

export function endOfLondonDay(dateKey: string): Date {
  const nextKey = addLondonDays(dateKey, 1);
  return new Date(startOfLondonDay(nextKey).getTime() - 1);
}

export function addLondonDays(dateKey: string, days: number): string {
  const noonUtc = new Date(`${dateKey}T12:00:00.000Z`);
  noonUtc.setUTCDate(noonUtc.getUTCDate() + days);
  return londonDateKey(noonUtc);
}

export function enumerateLondonDayKeys(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cursor = startKey;
  for (let i = 0; i < 400; i += 1) {
    keys.push(cursor);
    if (cursor === endKey) break;
    cursor = addLondonDays(cursor, 1);
  }
  return keys;
}

export function isEligibleBusinessSale(order: BusinessAnalyticsOrderLike): boolean {
  if (order.seller_context !== "business") return false;
  if ((BUSINESS_ANALYTICS_INELIGIBLE_STATUSES as readonly string[]).includes(order.status)) {
    return false;
  }
  if (order.refunded_at) return false;
  if (order.stripe_refund_id) return false;
  const refundStatus = (order.refund_status ?? "").trim().toLowerCase();
  if (refundStatus && refundStatus !== "none" && refundStatus !== "pending") {
    return false;
  }
  if (Number(order.refunded_amount ?? 0) > 0) return false;
  return true;
}

export function computeAverageSale(sales: number, orders: number): number | null {
  if (orders <= 0) return null;
  return sales / orders;
}

/** Canonical conversion: Quantity Sold ÷ Listing Views × 100. */
export function computeConversionRate(quantitySold: number, listingViews: number): number | null {
  if (listingViews <= 0) return null;
  return Number(((quantitySold / listingViews) * 100).toFixed(1));
}

export function computePeriodDelta(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior <= 0) return null;
  return Number((((current - prior) / prior) * 100).toFixed(1));
}

export function inInclusiveWindow(iso: string, start: Date, end: Date): boolean {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function bucketByLondonDay(
  timestamps: string[],
  dayKeys: string[],
  amountForIndex?: (index: number) => number,
): { date: string; label: string; value: number }[] {
  const totals = new Map(dayKeys.map((key) => [key, 0]));
  timestamps.forEach((iso, index) => {
    const key = londonDateKey(new Date(iso));
    if (!totals.has(key)) return;
    totals.set(key, (totals.get(key) ?? 0) + (amountForIndex ? amountForIndex(index) : 1));
  });
  return dayKeys.map((date) => ({
    date,
    label: formatBusinessDateLabel(date),
    value: totals.get(date) ?? 0,
  }));
}

export function pickChartTickIndexes(length: number, maxTicks = 5): number[] {
  if (length <= 0) return [];
  if (length <= maxTicks) return Array.from({ length }, (_, index) => index);
  const last = length - 1;
  const ticks = new Set<number>([0, last]);
  const inner = maxTicks - 2;
  for (let i = 1; i <= inner; i += 1) {
    ticks.add(Math.round((i * last) / (inner + 1)));
  }
  return [...ticks].sort((a, b) => a - b);
}

export function niceAxisMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 4;
  const padded = value * 1.05;
  const pow = 10 ** Math.floor(Math.log10(padded));
  const n = padded / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

export function resolveBusinessAnalyticsWindow(input: {
  period: BusinessAnalyticsPeriodId;
  now?: Date;
  customFrom?: string | null;
  customTo?: string | null;
}): BusinessAnalyticsWindow {
  const now = input.now ?? new Date();
  const todayKey = londonDateKey(now);
  let startKey = todayKey;
  let endKey = todayKey;
  let end = now;
  let label = "Today";
  let priorLabel = "vs prior day";

  if (input.period === "today") {
    startKey = todayKey;
    endKey = todayKey;
    label = "Today";
    priorLabel = "vs prior day";
  } else if (input.period === "7d") {
    startKey = addLondonDays(todayKey, -6);
    label = "7 Days";
    priorLabel = "vs prior 7 days";
  } else if (input.period === "30d") {
    startKey = addLondonDays(todayKey, -29);
    label = "30 Days";
    priorLabel = "vs prior 30 days";
  } else if (input.period === "90d") {
    startKey = addLondonDays(todayKey, -89);
    label = "90 Days";
    priorLabel = "vs prior 90 days";
  } else {
    const fromKey = /^\d{4}-\d{2}-\d{2}$/.test(input.customFrom ?? "")
      ? (input.customFrom as string)
      : addLondonDays(todayKey, -29);
    const toKey = /^\d{4}-\d{2}-\d{2}$/.test(input.customTo ?? "")
      ? (input.customTo as string)
      : todayKey;
    const ordered = fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];
    startKey = ordered[0];
    endKey = ordered[1];
    end = endKey === todayKey ? now : endOfLondonDay(endKey);
    label = "Custom";
    const days = enumerateLondonDayKeys(startKey, endKey).length;
    priorLabel = `vs prior ${days} day${days === 1 ? "" : "s"}`;
  }

  const start = startOfLondonDay(startKey);
  if (input.period !== "custom") {
    end = now;
  }

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
    priorLabel,
    dayKeys: enumerateLondonDayKeys(startKey, endKey),
  };
}

export function resolvePriorBusinessAnalyticsWindow(
  current: BusinessAnalyticsWindow,
): { start: Date; end: Date; startIso: string; endIso: string } {
  const durationMs = current.end.getTime() - current.start.getTime();
  const end = new Date(current.start.getTime() - 1);
  const start = new Date(end.getTime() - durationMs);
  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export const BUSINESS_ANALYTICS_CAPABILITIES = {
  clickThroughRate: false,
  trafficSources: false,
  searchKeywords: false,
} as const;

export function listingHrefFromSlug(slug: string | null | undefined, productId: string): string {
  const trimmed = slug?.trim();
  if (trimmed) return `/listing/${encodeURIComponent(trimmed)}`;
  return `/seller/listings/${encodeURIComponent(productId)}/edit`;
}
