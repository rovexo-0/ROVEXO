/**
 * ROVEXO Demand Engine V1.0 — read-only adapters (server).
 * Does not mutate source tables. Does not create demand counters.
 */

import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { demandBadgeLabelFromResult } from "@/lib/demand/demand-badge-label-v1";
import {
  demandWindowStart,
  evaluateDemand,
  isErrorRead,
  type DemandDataSource,
  type DemandEngineResult,
} from "@/lib/demand/demand-engine-v1";

export function createCanonicalDemandDataSource(): DemandDataSource {
  return {
    async readAvailability(productId) {
      const admin = tryCreateAdminClient();
      if (!admin) return "error";
      const { data, error } = await admin
        .from("products")
        .select("id, seller_id, status, stock")
        .eq("id", productId)
        .maybeSingle();
      if (error) return "error";
      if (!data?.id || !data.seller_id || data.status == null || data.stock == null) {
        return data ? "error" : null;
      }
      const stock = Number(data.stock);
      if (!Number.isFinite(stock)) return "error";
      return {
        productId: data.id,
        sellerId: data.seller_id,
        status: String(data.status),
        stock,
      };
    },

    async readOffers(productId, windowStartIso) {
      const admin = tryCreateAdminClient();
      if (!admin) return "error";
      const { data, error } = await admin
        .from("offers")
        .select("product_id, buyer_id, created_at, message, status")
        .eq("product_id", productId)
        .gte("created_at", windowStartIso);
      if (error) return "error";
      return (data ?? []).map((row) => ({
        productId: row.product_id,
        buyerId: row.buyer_id,
        createdAt: row.created_at,
        message: row.message,
        status: row.status,
      }));
    },

    async readFavourites(productId, windowStartIso) {
      const admin = tryCreateAdminClient();
      if (!admin) return "error";
      const { data, error } = await admin
        .from("saved_items")
        .select("user_id, product_id, saved_at")
        .eq("product_id", productId)
        .gte("saved_at", windowStartIso);
      if (error) return "error";
      return (data ?? []).map((row) => ({
        productId: row.product_id,
        userId: row.user_id,
        savedAt: row.saved_at,
      }));
    },

    async readQualifiedViews(productId, windowStartIso) {
      const admin = tryCreateAdminClient();
      if (!admin) return "error";
      const { data, error } = await admin
        .from("product_view_events")
        .select("product_id, viewer_key, viewer_user_id, created_at")
        .eq("product_id", productId)
        .gte("created_at", windowStartIso);
      if (error) return "error";
      return (data ?? []).map((row) => ({
        productId: row.product_id,
        viewerKey: row.viewer_key,
        viewerUserId: row.viewer_user_id,
        createdAt: row.created_at,
        qualified: true,
      }));
    },
  };
}

export async function resolveListingDemand(input: {
  productId: string;
  now?: Date;
  source?: DemandDataSource;
}): Promise<DemandEngineResult> {
  const productId = input.productId?.trim() ?? "";
  if (!productId) {
    return { state: "UNKNOWN", productId: null, badge: null };
  }

  const now = input.now ?? new Date();
  const source = input.source ?? createCanonicalDemandDataSource();
  const windowStartIso = demandWindowStart(now).toISOString();

  try {
    const availability = await source.readAvailability(productId);
    if (isErrorRead(availability)) {
      return { state: "UNKNOWN", productId, badge: null };
    }
    if (!availability?.sellerId) {
      return { state: "UNKNOWN", productId, badge: null };
    }

    const [offers, favourites, views] = await Promise.all([
      source.readOffers(productId, windowStartIso),
      source.readFavourites(productId, windowStartIso),
      source.readQualifiedViews(productId, windowStartIso),
    ]);

    return evaluateDemand({
      productId,
      sellerId: availability.sellerId,
      availability,
      offers,
      favourites,
      views,
      now,
    });
  } catch {
    return { state: "UNKNOWN", productId, badge: null };
  }
}

export async function resolveDemandBadgeLabels(
  productIds: string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (productId) => {
      const demand = await resolveListingDemand({ productId });
      return [productId, demandBadgeLabelFromResult(demand)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
