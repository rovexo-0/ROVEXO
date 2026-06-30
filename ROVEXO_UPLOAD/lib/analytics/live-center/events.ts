import { createAdminClient } from "@/lib/supabase/admin";
import {
  countryCodeToFlag,
  getCountryName,
  normalizeCountryCode,
} from "@/lib/analytics/live-countries/countries";
import {
  normalizeBrowser,
  normalizeOperatingSystem,
} from "@/lib/analytics/live-center/normalize";
import type { LiveEventItem } from "@/lib/analytics/live-center/types";

const EVENT_WINDOW_MS = 15 * 60_000;

function eventCutoffIso(): string {
  return new Date(Date.now() - EVENT_WINDOW_MS).toISOString();
}

function toEvent(
  partial: Omit<LiveEventItem, "id"> & { id?: string },
): LiveEventItem {
  return {
    id: partial.id ?? `${partial.type}-${partial.timestamp}`,
    type: partial.type,
    title: partial.title,
    subtitle: partial.subtitle,
    countryCode: partial.countryCode,
    countryName: partial.countryName,
    flag: partial.flag,
    browser: partial.browser,
    operatingSystem: partial.operatingSystem,
    timestamp: partial.timestamp,
  };
}

export async function getLiveEventFeed(limit = 60): Promise<LiveEventItem[]> {
  const admin = createAdminClient();
  const cutoff = eventCutoffIso();
  const events: LiveEventItem[] = [];

  const [
    sessions,
    sellers,
    listings,
    orders,
    payments,
    refunds,
    signIns,
  ] = await Promise.all([
    admin
      .from("live_visitor_sessions")
      .select(
        "session_id, country_code, country_name, browser, operating_system, created_at, last_seen_at",
      )
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("profiles")
      .select("id, created_at, role")
      .eq("role", "seller")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("products")
      .select("id, title, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("orders")
      .select("id, order_number, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("orders")
      .select("id, order_number, paid_at")
      .not("paid_at", "is", null)
      .gte("paid_at", cutoff)
      .order("paid_at", { ascending: false })
      .limit(15),
    admin
      .from("orders")
      .select("id, order_number, refunded_at")
      .not("refunded_at", "is", null)
      .gte("refunded_at", cutoff)
      .order("refunded_at", { ascending: false })
      .limit(10),
    admin
      .from("platform_audit_logs")
      .select("id, action, created_at, metadata")
      .gte("created_at", cutoff)
      .in("action", ["user_signed_in", "user_signed_out"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  for (const row of sessions.data ?? []) {
    const code = normalizeCountryCode(row.country_code);
    events.push(
      toEvent({
        id: `visitor-${row.session_id}-${row.created_at}`,
        type: "visitor_joined",
        title: "Visitor joined",
        countryCode: code ?? undefined,
        countryName: row.country_name || (code ? getCountryName(code) : undefined),
        flag: code ? countryCodeToFlag(code) : undefined,
        browser: row.browser ? normalizeBrowser(row.browser) : undefined,
        operatingSystem: row.operating_system
          ? normalizeOperatingSystem(row.operating_system)
          : undefined,
        timestamp: row.created_at,
      }),
    );
  }

  for (const row of sellers.data ?? []) {
    events.push(
      toEvent({
        id: `seller-${row.id}`,
        type: "seller_registered",
        title: "New Seller Registered",
        timestamp: row.created_at,
      }),
    );
  }

  for (const row of listings.data ?? []) {
    events.push(
      toEvent({
        id: `listing-${row.id}`,
        type: "listing_published",
        title: "Listing Published",
        subtitle: row.title,
        timestamp: row.created_at,
      }),
    );
  }

  for (const row of orders.data ?? []) {
    events.push(
      toEvent({
        id: `order-${row.id}`,
        type: "order_created",
        title: "Order Created",
        subtitle: row.order_number,
        timestamp: row.created_at,
      }),
    );
  }

  for (const row of payments.data ?? []) {
    if (!row.paid_at) continue;
    events.push(
      toEvent({
        id: `payment-${row.id}`,
        type: "payment_completed",
        title: "Payment Completed",
        subtitle: row.order_number,
        timestamp: row.paid_at,
      }),
    );
  }

  for (const row of refunds.data ?? []) {
    if (!row.refunded_at) continue;
    events.push(
      toEvent({
        id: `refund-${row.id}`,
        type: "refund_created",
        title: "Refund Created",
        subtitle: row.order_number,
        timestamp: row.refunded_at,
      }),
    );
  }

  for (const row of signIns.data ?? []) {
    const action = row.action === "user_signed_out" ? "user_signed_out" : "user_signed_in";
    events.push(
      toEvent({
        id: `auth-${row.id}`,
        type: action,
        title: action === "user_signed_out" ? "User Signed Out" : "User Signed In",
        timestamp: row.created_at,
      }),
    );
  }

  return events
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, limit);
}
