import { createAdminClient } from "@/lib/supabase/admin";

export type SuperAdminSearchResult = {
  type: "user" | "listing" | "business" | "order" | "report" | "message";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function runSuperAdminGlobalSearch(query: string): Promise<SuperAdminSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const admin = createAdminClient();
  const pattern = `%${trimmed}%`;
  const results: SuperAdminSearchResult[] = [];

  const [users, listings, businesses, orders, reports, messages] = await Promise.all([
    admin
      .from("profiles")
      .select("id, username, full_name, email")
      .or(`username.ilike.${pattern},full_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(8),
    admin
      .from("products")
      .select("id, title, slug, seller_id")
      .ilike("title", pattern)
      .limit(8),
    admin
      .from("business_accounts")
      .select("id, business_name, tax_id")
      .ilike("business_name", pattern)
      .limit(8),
    admin
      .from("orders")
      .select("id, order_number, buyer_id, seller_id, total")
      .ilike("order_number", pattern)
      .limit(8),
    admin
      .from("content_reports")
      .select("id, reason, target_type, target_id")
      .ilike("reason", pattern)
      .limit(8),
    admin
      .from("messages")
      .select("id, content, conversation_id")
      .ilike("content", pattern)
      .limit(8),
  ]);

  for (const user of users.data ?? []) {
    results.push({
      type: "user",
      id: user.id,
      title: user.full_name,
      subtitle: `@${user.username} · ${user.email}`,
      href: `/super-admin/users?q=${encodeURIComponent(user.username)}`,
    });
  }

  for (const listing of listings.data ?? []) {
    results.push({
      type: "listing",
      id: listing.id,
      title: listing.title,
      subtitle: listing.slug,
      href: `/listing/${listing.slug}`,
    });
  }

  for (const business of businesses.data ?? []) {
    results.push({
      type: "business",
      id: business.id,
      title: business.business_name,
      subtitle: business.tax_id ?? "Business account",
      href: `/super-admin/businesses`,
    });
  }

  for (const order of orders.data ?? []) {
    results.push({
      type: "order",
      id: order.id,
      title: order.order_number,
      subtitle: `£${Number(order.total).toFixed(2)}`,
      href: `/orders/${order.id}`,
    });
  }

  for (const report of reports.data ?? []) {
    results.push({
      type: "report",
      id: report.id,
      title: report.reason,
      subtitle: `${report.target_type} · ${report.target_id}`,
      href: `/super-admin/reports`,
    });
  }

  for (const message of messages.data ?? []) {
    results.push({
      type: "message",
      id: message.id,
      title: message.content.slice(0, 80),
      subtitle: message.conversation_id,
      href: `/messages/${message.conversation_id}`,
    });
  }

  return results.slice(0, 30);
}
