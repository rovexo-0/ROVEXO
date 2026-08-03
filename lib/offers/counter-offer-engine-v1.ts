/**
 * ROVEXO Absolute Blood Law XLIII — Counter Offer Engine v1.0
 *
 * FAIL CLOSED · deterministic · explicit errors · atomic cancel+insert
 * Parent authz via session user; mutations via admin after validation
 * (seller counter cannot pass buyer-only RLS insert).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  mergeBundleIntoOfferMessage,
  parseBundleMessageMeta,
} from "@/lib/bundle/bundle-payload-v1";
import { appendBundleEvent } from "@/lib/bundle/bundle-events-v1";

export const COUNTER_OFFER_ENGINE_V1 = {
  version: "1.0",
  bloodLaw: "XLIII",
  name: "Counter Offer Engine",
} as const;

/** Message prefix storing counter authorship + parent (no schema change). */
export const COUNTER_OFFER_MESSAGE_META_PREFIX = "__RVX_COUNTER__" as const;

export type CounterOfferActorRole = "buyer" | "seller";

export type CounterOfferErrorCode =
  | "OFFER_NOT_FOUND"
  | "OFFER_EXPIRED"
  | "OFFER_ALREADY_ACCEPTED"
  | "OFFER_ALREADY_DECLINED"
  | "OFFER_CANCELLED"
  | "OFFER_ALREADY_COUNTERED"
  | "OFFER_LOCKED"
  | "OFFER_VERSION_MISMATCH"
  | "OFFER_AMOUNT_INVALID"
  | "OFFER_NOT_PENDING"
  | "PERMISSION_DENIED"
  | "LISTING_NOT_FOUND"
  | "LISTING_NOT_OWNED"
  | "DATABASE_UPDATE_FAILED";

export type CounterOfferError = {
  ok: false;
  code: CounterOfferErrorCode;
  message: string;
  httpStatus: number;
};

export type CounterOfferSuccess = {
  ok: true;
  status: "countered";
  parentOfferId: string;
  offer: {
    id: string;
    amount: number;
    status: "pending";
    createdAt: string;
    fromRole: CounterOfferActorRole;
    parentOfferId: string;
  };
};

export type CounterOfferResult = CounterOfferSuccess | CounterOfferError;

const ERROR_COPY: Record<CounterOfferErrorCode, { message: string; httpStatus: number }> = {
  OFFER_NOT_FOUND: { message: "Offer not found.", httpStatus: 404 },
  OFFER_EXPIRED: { message: "Offer expired.", httpStatus: 409 },
  OFFER_ALREADY_ACCEPTED: { message: "Offer already accepted.", httpStatus: 409 },
  OFFER_ALREADY_DECLINED: { message: "Offer already declined.", httpStatus: 409 },
  OFFER_CANCELLED: { message: "Offer cancelled.", httpStatus: 409 },
  OFFER_ALREADY_COUNTERED: { message: "Offer already countered.", httpStatus: 409 },
  OFFER_LOCKED: { message: "Offer locked.", httpStatus: 409 },
  OFFER_VERSION_MISMATCH: { message: "Offer version mismatch.", httpStatus: 409 },
  OFFER_AMOUNT_INVALID: { message: "Offer amount invalid.", httpStatus: 400 },
  OFFER_NOT_PENDING: { message: "Offer is no longer open.", httpStatus: 409 },
  PERMISSION_DENIED: { message: "Permission denied.", httpStatus: 403 },
  LISTING_NOT_FOUND: { message: "Listing not found.", httpStatus: 404 },
  LISTING_NOT_OWNED: { message: "Seller does not own this listing.", httpStatus: 403 },
  DATABASE_UPDATE_FAILED: { message: "Database update failed.", httpStatus: 500 },
};

function fail(code: CounterOfferErrorCode): CounterOfferError {
  const copy = ERROR_COPY[code];
  return { ok: false, code, message: copy.message, httpStatus: copy.httpStatus };
}

/** Public copy map for API routes (accept/decline non-pending gates). */
export const COUNTER_OFFER_ERROR_COPY = ERROR_COPY;

export function mapOfferStatusToCounterError(
  status: string | null | undefined,
): CounterOfferErrorCode {
  switch (status) {
    case "pending":
      return "OFFER_NOT_PENDING";
    case "accepted":
      return "OFFER_ALREADY_ACCEPTED";
    case "rejected":
      return "OFFER_ALREADY_DECLINED";
    case "expired":
      return "OFFER_EXPIRED";
    case "cancelled":
      return "OFFER_CANCELLED";
    default:
      return "OFFER_NOT_PENDING";
  }
}

export function encodeCounterOfferMessageMeta(
  fromRole: CounterOfferActorRole,
  parentOfferId: string,
  userMessage?: string | null,
): string {
  const meta = `${COUNTER_OFFER_MESSAGE_META_PREFIX}:${fromRole}:${parentOfferId}__`;
  const body = userMessage?.trim() ?? "";
  return body ? `${meta}${body}` : meta;
}

export function parseCounterOfferMessageMeta(message: string | null | undefined): {
  fromRole: CounterOfferActorRole | null;
  parentOfferId: string | null;
  userMessage: string | null;
} {
  if (!message) {
    return { fromRole: null, parentOfferId: null, userMessage: null };
  }
  const match = message.match(
    /^__RVX_COUNTER__:(buyer|seller):([0-9a-f-]{36})__(.*)$/i,
  );
  if (!match) {
    return { fromRole: null, parentOfferId: null, userMessage: message };
  }
  return {
    fromRole: match[1].toLowerCase() as CounterOfferActorRole,
    parentOfferId: match[2],
    userMessage: match[3]?.trim() ? match[3] : null,
  };
}

export function resolveOfferFromRole(input: {
  buyerId: string;
  message: string | null | undefined;
  /** When known (e.g. create), prefer this. */
  explicitFromRole?: CounterOfferActorRole | null;
}): CounterOfferActorRole {
  if (input.explicitFromRole) return input.explicitFromRole;
  const parsed = parseCounterOfferMessageMeta(input.message);
  if (parsed.fromRole) return parsed.fromRole;
  // Initial offers are always created by the buyer.
  return "buyer";
}

type ExecuteCounterOfferInput = {
  offerId: string;
  actorUserId: string;
  amount: number;
  message?: string | null;
  /** Optional client expected status — fail closed on mismatch. */
  expectedStatus?: string | null;
};

/**
 * Atomic Counter Offer:
 * 1) Validate participant + listing + pending
 * 2) Cancel parent only if still pending (optimistic lock)
 * 3) Insert child pending with authorship meta
 * 4) On insert failure → restore parent to pending
 * Never mute errors. Never leave UI/backend desynced intentionally.
 */
export async function executeCounterOffer(
  input: ExecuteCounterOfferInput,
): Promise<CounterOfferResult> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return fail("OFFER_AMOUNT_INVALID");
  }

  const admin = createAdminClient();

  const { data: offer, error: loadError } = await admin
    .from("offers")
    .select("id, product_id, buyer_id, seller_id, amount, status, message")
    .eq("id", input.offerId)
    .maybeSingle();

  if (loadError) {
    return fail("DATABASE_UPDATE_FAILED");
  }
  if (!offer) {
    return fail("OFFER_NOT_FOUND");
  }

  const isSeller = offer.seller_id === input.actorUserId;
  const isBuyer = offer.buyer_id === input.actorUserId;
  if (!isSeller && !isBuyer) {
    return fail("PERMISSION_DENIED");
  }

  if (input.expectedStatus && offer.status !== input.expectedStatus) {
    return fail("OFFER_VERSION_MISMATCH");
  }

  if (offer.status !== "pending") {
    // If already cancelled, check whether a child counter already exists.
    if (offer.status === "cancelled") {
      const { data: siblings } = await admin
        .from("offers")
        .select("id, message")
        .eq("product_id", offer.product_id)
        .eq("buyer_id", offer.buyer_id)
        .eq("seller_id", offer.seller_id)
        .eq("status", "pending")
        .limit(20);
      const child = (siblings ?? []).find(
        (row) => parseCounterOfferMessageMeta(row.message).parentOfferId === offer.id,
      );
      if (child) {
        return fail("OFFER_ALREADY_COUNTERED");
      }
    }
    return fail(mapOfferStatusToCounterError(offer.status));
  }

  const { data: listing, error: listingError } = await admin
    .from("products")
    .select("id, seller_id, status, accept_offers, price")
    .eq("id", offer.product_id)
    .maybeSingle();

  if (listingError) {
    return fail("DATABASE_UPDATE_FAILED");
  }
  if (!listing) {
    return fail("LISTING_NOT_FOUND");
  }
  if (listing.seller_id !== offer.seller_id) {
    return fail("LISTING_NOT_OWNED");
  }
  if (isSeller && listing.seller_id !== input.actorUserId) {
    return fail("PERMISSION_DENIED");
  }

  // Amount must be positive and below ceiling:
  // Bundle offers → listSubtotal; single listing → listing price.
  const { bundle } = parseBundleMessageMeta(offer.message);
  const ceiling = bundle?.listSubtotal ?? Number(listing.price);
  if (
    !Number.isFinite(ceiling) ||
    ceiling <= 0 ||
    input.amount >= ceiling ||
    input.amount === Number(offer.amount)
  ) {
    return fail("OFFER_AMOUNT_INVALID");
  }

  const fromRole: CounterOfferActorRole = isSeller ? "seller" : "buyer";
  const counterMessage = mergeBundleIntoOfferMessage(
    offer.message,
    encodeCounterOfferMessageMeta(fromRole, offer.id, input.message ?? null),
  );

  // Optimistic lock: cancel only while still pending.
  const { data: cancelledRows, error: cancelError } = await admin
    .from("offers")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", offer.id)
    .eq("status", "pending")
    .select("id");

  if (cancelError) {
    return fail("DATABASE_UPDATE_FAILED");
  }
  if (!cancelledRows || cancelledRows.length === 0) {
    return fail("OFFER_VERSION_MISMATCH");
  }

  const { data: counter, error: insertError } = await admin
    .from("offers")
    .insert({
      product_id: offer.product_id,
      buyer_id: offer.buyer_id,
      seller_id: offer.seller_id,
      amount: input.amount,
      message: counterMessage,
      status: "pending",
    })
    .select("id, amount, status, created_at")
    .single();

  if (insertError || !counter) {
    // Restore parent — fail closed, no stranded cancelled offer without child.
    await admin
      .from("offers")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", offer.id)
      .eq("status", "cancelled");
    return fail("DATABASE_UPDATE_FAILED");
  }

  if (bundle?.bundleId) {
    await appendBundleEvent({
      bundleId: bundle.bundleId,
      actorId: input.actorUserId,
      eventType: "bundle.offer_countered",
      payload: {
        offerId: counter.id,
        parentOfferId: offer.id,
        amount: Number(counter.amount),
      },
    });
  }

  return {
    ok: true,
    status: "countered",
    parentOfferId: offer.id,
    offer: {
      id: counter.id,
      amount: Number(counter.amount),
      status: "pending",
      createdAt: counter.created_at,
      fromRole,
      parentOfferId: offer.id,
    },
  };
}
