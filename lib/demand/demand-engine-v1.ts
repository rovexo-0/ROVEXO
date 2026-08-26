/**
 * ROVEXO Demand Engine V1.0 — ONE owner, ONE implementation, Web only.
 *
 * Listing identity: product_id
 * States: IN_DEMAND | NOT_IN_DEMAND | UNKNOWN
 * No score. No Messages. No Search Demand. No Category Demand. No DB demand columns.
 *
 * ACTIVE + isPurchasable() + stock > 0
 * + (≥1 qualifying offer OR ≥3 qualifying favourites OR ≥10 qualified views)
 * within 7 days → IN_DEMAND
 *
 * Fail closed: any unsafe read → UNKNOWN → no badge.
 */

import { isPurchasable } from "@/lib/inventory/service";
import { parseBundleMessageMeta } from "@/lib/bundle/bundle-payload-v1";
import { resolveOfferFromRole } from "@/lib/offers/counter-offer-engine-v1";
import {
  CATEGORY_DEMAND_ENABLED,
  DEMAND_CARD_COPY,
  DEMAND_DETAIL_BODY_COPY,
  DEMAND_DETAIL_TITLE_COPY,
  DEMAND_ENGINE_CONFIG_V1,
  DEMAND_WINDOW_MS,
  FAVOURITE_THRESHOLD,
  MESSAGES_ENABLED,
  OFFER_THRESHOLD,
  QUALIFIED_VIEW_THRESHOLD,
  SEARCH_DEMAND_ENABLED,
} from "@/lib/demand/demand-engine-config-v1";

export type DemandState = "IN_DEMAND" | "NOT_IN_DEMAND" | "UNKNOWN";

export type DemandBadgeCopy = {
  card: typeof DEMAND_CARD_COPY;
  detailTitle: typeof DEMAND_DETAIL_TITLE_COPY;
  detailBody: typeof DEMAND_DETAIL_BODY_COPY;
};

export type DemandEngineResult = {
  state: DemandState;
  productId: string | null;
  badge: DemandBadgeCopy | null;
};

export type DemandAvailabilityRow = {
  productId: string;
  sellerId: string;
  status: string;
  stock: number;
};

export type DemandOfferRow = {
  productId: string;
  buyerId: string;
  createdAt: string;
  message?: string | null;
  status?: string | null;
};

export type DemandFavouriteRow = {
  productId: string;
  userId: string;
  savedAt: string;
};

export type DemandQualifiedViewRow = {
  productId: string;
  viewerKey: string;
  createdAt: string;
  viewerUserId?: string | null;
  /** Rows from product_view_events are already View Engine v1 qualified. */
  qualified?: boolean;
};

export type DemandSignalRead<T> = T | "error";

export type DemandEvaluationInput = {
  productId: string;
  sellerId: string;
  availability: DemandSignalRead<DemandAvailabilityRow | null>;
  offers: DemandSignalRead<DemandOfferRow[]>;
  favourites: DemandSignalRead<DemandFavouriteRow[]>;
  views: DemandSignalRead<DemandQualifiedViewRow[]>;
  now?: Date;
};

export type DemandDataSource = {
  readAvailability(
    productId: string,
  ): Promise<DemandSignalRead<DemandAvailabilityRow | null>>;
  readOffers(
    productId: string,
    windowStartIso: string,
  ): Promise<DemandSignalRead<DemandOfferRow[]>>;
  readFavourites(
    productId: string,
    windowStartIso: string,
  ): Promise<DemandSignalRead<DemandFavouriteRow[]>>;
  readQualifiedViews(
    productId: string,
    windowStartIso: string,
  ): Promise<DemandSignalRead<DemandQualifiedViewRow[]>>;
};

export function isErrorRead<T>(value: DemandSignalRead<T>): value is "error" {
  return value === "error";
}

function inWindow(iso: string, windowStartMs: number, nowMs: number): boolean {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return false;
  return ts >= windowStartMs && ts <= nowMs;
}

function sellerViewerKey(sellerId: string): string {
  return `user:${sellerId}`;
}

function isBotViewerKey(viewerKey: string): boolean {
  return viewerKey === "bot:blocked" || viewerKey.startsWith("bot:");
}

export function demandWindowStart(now: Date): Date {
  return new Date(now.getTime() - DEMAND_WINDOW_MS);
}

export function demandBadgeFromState(state: DemandState): DemandBadgeCopy | null {
  if (state !== "IN_DEMAND") return null;
  return {
    card: DEMAND_CARD_COPY,
    detailTitle: DEMAND_DETAIL_TITLE_COPY,
    detailBody: DEMAND_DETAIL_BODY_COPY,
  };
}

export function offerQualifiesForDemand(
  row: DemandOfferRow,
  input: { productId: string; sellerId: string; windowStartMs: number; nowMs: number },
): boolean {
  if (row.productId !== input.productId) return false;
  if (!row.buyerId) return false;
  if (row.buyerId === input.sellerId) return false;
  if (!inWindow(row.createdAt, input.windowStartMs, input.nowMs)) return false;
  if (resolveOfferFromRole({ buyerId: row.buyerId, message: row.message }) !== "buyer") {
    return false;
  }
  const bundle = parseBundleMessageMeta(row.message).bundle;
  if (bundle) {
    return bundle.lines.some((line) => line.productId === input.productId);
  }
  return true;
}

export function countQualifyingOfferBuyers(
  rows: DemandOfferRow[],
  input: { productId: string; sellerId: string; windowStartMs: number; nowMs: number },
): number {
  const buyers = new Set<string>();
  for (const row of rows) {
    if (offerQualifiesForDemand(row, input)) buyers.add(row.buyerId);
  }
  return buyers.size;
}

export function countQualifyingFavouriteUsers(
  rows: DemandFavouriteRow[],
  input: { productId: string; sellerId: string; windowStartMs: number; nowMs: number },
): number {
  const users = new Set<string>();
  for (const row of rows) {
    if (row.productId !== input.productId) continue;
    if (!row.userId) continue;
    if (row.userId === input.sellerId) continue;
    if (!inWindow(row.savedAt, input.windowStartMs, input.nowMs)) continue;
    users.add(row.userId);
  }
  return users.size;
}

export function countQualifyingViewers(
  rows: DemandQualifiedViewRow[],
  input: { productId: string; sellerId: string; windowStartMs: number; nowMs: number },
): number {
  const viewers = new Set<string>();
  for (const row of rows) {
    if (row.productId !== input.productId) continue;
    if (row.qualified === false) continue;
    if (!row.viewerKey) continue;
    if (isBotViewerKey(row.viewerKey)) continue;
    if (row.viewerKey === sellerViewerKey(input.sellerId)) continue;
    if (row.viewerUserId && row.viewerUserId === input.sellerId) continue;
    if (!inWindow(row.createdAt, input.windowStartMs, input.nowMs)) continue;
    viewers.add(row.viewerKey);
  }
  return viewers.size;
}

function availabilityBlocksDemand(row: DemandAvailabilityRow): boolean {
  if (row.status === "reserved") return true;
  if (row.status === "sold") return true;
  if (!(row.stock > 0)) return true;
  if (row.status !== "published") return true;
  return !isPurchasable(row.stock, row.status);
}

export function evaluateDemand(input: DemandEvaluationInput): DemandEngineResult {
  const productId = input.productId?.trim() ?? "";
  const sellerId = input.sellerId?.trim() ?? "";
  if (!productId || !sellerId) {
    return { state: "UNKNOWN", productId: productId || null, badge: null };
  }

  if (
    isErrorRead(input.availability) ||
    isErrorRead(input.offers) ||
    isErrorRead(input.favourites) ||
    isErrorRead(input.views)
  ) {
    return { state: "UNKNOWN", productId, badge: null };
  }

  const availability = input.availability;
  if (!availability) {
    return { state: "UNKNOWN", productId, badge: null };
  }
  if (
    availability.productId !== productId ||
    availability.sellerId !== sellerId ||
    !Number.isFinite(availability.stock)
  ) {
    return { state: "UNKNOWN", productId, badge: null };
  }

  if (availabilityBlocksDemand(availability)) {
    return { state: "NOT_IN_DEMAND", productId, badge: null };
  }

  void MESSAGES_ENABLED;
  void SEARCH_DEMAND_ENABLED;
  void CATEGORY_DEMAND_ENABLED;

  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const windowStartMs = nowMs - DEMAND_WINDOW_MS;
  const windowInput = { productId, sellerId, windowStartMs, nowMs };

  const offerBuyers = countQualifyingOfferBuyers(input.offers, windowInput);
  const favouriteUsers = countQualifyingFavouriteUsers(input.favourites, windowInput);
  const viewers = countQualifyingViewers(input.views, windowInput);

  const qualifies =
    offerBuyers >= OFFER_THRESHOLD ||
    favouriteUsers >= FAVOURITE_THRESHOLD ||
    viewers >= QUALIFIED_VIEW_THRESHOLD;

  const state: DemandState = qualifies ? "IN_DEMAND" : "NOT_IN_DEMAND";
  return { state, productId, badge: demandBadgeFromState(state) };
}

export { DEMAND_ENGINE_CONFIG_V1, isPurchasable };
