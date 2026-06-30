import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RfqRequest, WholesaleAccount, WholesalePricingTier } from "@/lib/wholesale/types";

function mapAccount(row: Record<string, unknown>): WholesaleAccount {
  return {
    id: String(row.id),
    accountType: row.account_type as WholesaleAccount["accountType"],
    companyName: String(row.company_name),
    moqDefault: Number(row.moq_default),
    bulkPricingEnabled: Boolean(row.bulk_pricing_enabled),
    rfqEnabled: Boolean(row.rfq_enabled),
    verified: Boolean(row.verified),
  };
}

function mapTier(row: Record<string, unknown>): WholesalePricingTier {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    productId: row.product_id ? String(row.product_id) : null,
    minQuantity: Number(row.min_quantity),
    unitPrice: Number(row.unit_price),
    currency: String(row.currency),
  };
}

function mapRfq(row: Record<string, unknown>): RfqRequest {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    sellerId: row.seller_id ? String(row.seller_id) : null,
    title: String(row.title),
    description: String(row.description),
    quantity: Number(row.quantity),
    categorySlug: row.category_slug ? String(row.category_slug) : null,
    status: String(row.status),
    premium: Boolean(row.premium),
    createdAt: String(row.created_at),
  };
}

export async function getWholesaleAccount(userId: string): Promise<WholesaleAccount | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("wholesale_accounts").select("*").eq("id", userId).maybeSingle();
    return data ? mapAccount(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function upsertWholesaleAccount(input: {
  userId: string;
  companyName: string;
  accountType?: WholesaleAccount["accountType"];
}): Promise<WholesaleAccount | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wholesale_accounts")
      .upsert(
        {
          id: input.userId,
          company_name: input.companyName,
          account_type: input.accountType ?? "wholesale",
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();
    if (error || !data) return null;
    return mapAccount(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listWholesalePricingTiers(sellerId: string): Promise<WholesalePricingTier[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wholesale_pricing_tiers")
      .select("*")
      .eq("seller_id", sellerId)
      .eq("active", true)
      .order("min_quantity", { ascending: true });
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapTier);
  } catch {
    return [];
  }
}

export async function createWholesalePricingTier(input: {
  sellerId: string;
  minQuantity: number;
  unitPrice: number;
  productId?: string | null;
  currency?: string;
}): Promise<WholesalePricingTier | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wholesale_pricing_tiers")
      .insert({
        seller_id: input.sellerId,
        min_quantity: input.minQuantity,
        unit_price: input.unitPrice,
        product_id: input.productId ?? null,
        currency: input.currency ?? "GBP",
        active: true,
      })
      .select("*")
      .single();
    if (error || !data) return null;
    return mapTier(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function deleteWholesalePricingTier(sellerId: string, tierId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("wholesale_pricing_tiers")
      .update({ active: false })
      .eq("id", tierId)
      .eq("seller_id", sellerId);
    return !error;
  } catch {
    return false;
  }
}

export async function createRfqRequest(input: {
  buyerId: string;
  title: string;
  description: string;
  quantity: number;
  categorySlug?: string;
  premium?: boolean;
}): Promise<RfqRequest | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("rfq_requests")
      .insert({
        buyer_id: input.buyerId,
        title: input.title,
        description: input.description,
        quantity: input.quantity,
        category_slug: input.categorySlug ?? null,
        premium: input.premium ?? false,
        status: "open",
      })
      .select("*")
      .single();
    if (error || !data) return null;
    return mapRfq(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listOpenRfqRequests(limit = 20): Promise<RfqRequest[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rfq_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapRfq);
  } catch {
    return [];
  }
}

export async function getWholesaleAnalyticsSummary(): Promise<{
  accounts: number;
  openRfqs: number;
  pricingTiers: number;
}> {
  try {
    const admin = createAdminClient();
    const [{ count: accounts }, { count: openRfqs }, { count: pricingTiers }] = await Promise.all([
      admin.from("wholesale_accounts").select("*", { count: "exact", head: true }),
      admin.from("rfq_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
      admin.from("wholesale_pricing_tiers").select("*", { count: "exact", head: true }).eq("active", true),
    ]);
    return {
      accounts: accounts ?? 0,
      openRfqs: openRfqs ?? 0,
      pricingTiers: pricingTiers ?? 0,
    };
  } catch {
    return { accounts: 0, openRfqs: 0, pricingTiers: 0 };
  }
}
