/**
 * ROVEXO MASTER_CHECKOUT_ARCHITECTURE v1.0 — CHECKOUT_SESSION_ENGINE
 * Sole temporary object before payment. TTL = 120 seconds Absolute Law.
 * NOT an Order. NOT a Transaction.
 *
 * Inventory lifecycle Absolute Law:
 * NO listing may remain reserved without a completed order.
 * expire / cancel / abandon / crash → release → published.
 * Paid order / Stripe success → never restore (Order wins).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { releaseProductInventory } from "@/lib/inventory/service";
import {
  FINANCIAL_LOGGER,
  mintCheckoutSessionPublicId,
} from "@/lib/checkout/engines/idempotency-engine-v1";
import { CHECKOUT_SESSION_TTL_SECONDS } from "@/lib/checkout/engines/status-map-v1";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { isStripeRequired } from "@/lib/stripe/server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";
import {
  isBundleCheckoutSnapshot,
  type BundleCheckoutSnapshotV1,
} from "@/lib/bundle/bundle-snapshot-v1";
import { releaseBundleLinesFromSnapshot } from "@/lib/bundle/bundle-reservation-engine-v1";
import { restoreBundleAfterCheckoutCancel } from "@/lib/bundle/bundle-lifecycle-v1";

export type CheckoutSessionStatus = "open" | "expired" | "cancelled" | "paid";

export type CheckoutSessionRow = {
  id: string;
  public_id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  product_slug: string;
  currency: string;
  item_price: number;
  platform_fee: number;
  shipping: number;
  total: number;
  offer_id: string | null;
  conversation_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  order_id: string | null;
  status: CheckoutSessionStatus;
  expires_at: string;
  created_at: string;
  paid_at: string | null;
  /** Bundle Engine Phase 1 — immutable snapshot when multi-item. */
  bundle_lines?: BundleCheckoutSnapshotV1 | null;
};

export type PaymentIntentShell = {
  id: string;
  checkoutSessionId: string;
  status: "PENDING_PAYMENT" | "READY";
  mode: "stripe" | "virtual" | "dev";
};

export type InventoryLifecycleEvent =
  | "reserve"
  | "release"
  | "expire"
  | "cancel"
  | "restore"
  | "skip";

/** Structured inventory lifecycle logs — listing id · session id · reason. */
export function INVENTORY_LIFECYCLE_LOG(
  event: InventoryLifecycleEvent,
  fields: {
    listingId?: string | null;
    sessionId?: string | null;
    publicId?: string | null;
    reason: string;
    detail?: string;
  },
): void {
  const line = [
    "[RVX][INVENTORY]",
    event,
    fields.listingId ? `listing=${fields.listingId}` : null,
    fields.sessionId ? `session=${fields.sessionId}` : null,
    fields.publicId ? `public=${fields.publicId}` : null,
    `reason=${fields.reason}`,
    fields.detail ? `detail=${fields.detail}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  if (event === "skip") {
    console.info(line);
    return;
  }
  console.info(line);
}

function expiresAtIso(fromMs = Date.now()): string {
  return new Date(fromMs + CHECKOUT_SESSION_TTL_SECONDS * 1000).toISOString();
}

export function CHECKOUT_SESSION_ENGINE_isExpired(
  expiresAt: string | null | undefined,
): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function CHECKOUT_SESSION_ENGINE_create(input: {
  buyerId: string;
  sellerId: string;
  listingId: string;
  productSlug: string;
  currency: string;
  itemPrice: number;
  platformFee: number;
  shipping: number;
  total: number;
  offerId?: string | null;
  conversationId?: string | null;
  /** Bundle Engine — immutable checkout snapshot (multi-item). */
  bundleLines?: BundleCheckoutSnapshotV1 | null;
}): Promise<{ ok: true; session: CheckoutSessionRow } | { ok: false; reason: string }> {
  const admin = createAdminClient();
  const publicId = mintCheckoutSessionPublicId();
  const expiresAt = expiresAtIso();

  const insertPayload: Record<string, unknown> = {
    public_id: publicId,
    buyer_id: input.buyerId,
    seller_id: input.sellerId,
    listing_id: input.listingId,
    product_slug: input.productSlug,
    currency: input.currency,
    item_price: input.itemPrice,
    platform_fee: input.platformFee,
    shipping: input.shipping,
    total: input.total,
    offer_id: input.offerId ?? null,
    conversation_id: input.conversationId ?? null,
    status: "open",
    expires_at: expiresAt,
  };

  if (input.bundleLines) {
    insertPayload.bundle_lines = input.bundleLines;
  }

  const { data, error } = await admin
    .from("checkout_sessions")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (error || !data) {
    FINANCIAL_LOGGER("STOP", error?.message ?? "checkout session create failed");
    return { ok: false, reason: "Unable to create checkout session." };
  }

  FINANCIAL_LOGGER("PAYMENT SESSION PASS", publicId);
  return { ok: true, session: data as CheckoutSessionRow };
}

export async function CHECKOUT_SESSION_ENGINE_getByPublicId(
  publicId: string,
): Promise<CheckoutSessionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();
  return (data as CheckoutSessionRow | null) ?? null;
}

export async function CHECKOUT_SESSION_ENGINE_getOpenForBuyerListing(input: {
  buyerId: string;
  listingId: string;
}): Promise<CheckoutSessionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("buyer_id", input.buyerId)
    .eq("listing_id", input.listingId)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CheckoutSessionRow | null) ?? null;
}

async function stripeReportsPaymentSucceeded(
  session: CheckoutSessionRow,
): Promise<boolean> {
  if (!session.stripe_checkout_session_id || !isStripeConfigured()) {
    return false;
  }
  // Turbopack (Next 16.3) miscompiles destroy()'s unpaid path when this helper
  // uses try/catch around await and is awaited inside sessionHasPaidOrder.
  // Promise rejection handler preserves identical semantics: errors → false.
  return getStripeClient()
    .checkout.sessions.retrieve(session.stripe_checkout_session_id)
    .then(
      (stripeSession) =>
        stripeSession.payment_status === "paid" || stripeSession.status === "complete",
      () => false,
    );
}

async function sessionHasPaidOrder(session: CheckoutSessionRow): Promise<boolean> {
  if (session.status === "paid" || session.order_id) {
    return true;
  }

  const admin = createAdminClient();

  if (session.order_id) {
    const { data: order } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", session.order_id)
      .maybeSingle();
    if (order && order.status !== "cancelled" && order.status !== "awaiting_payment") {
      return true;
    }
  }

  if (session.stripe_checkout_session_id) {
    const { data: orderByStripe } = await admin
      .from("orders")
      .select("id, status")
      .eq("stripe_session_id", session.stripe_checkout_session_id)
      .neq("status", "cancelled")
      .limit(1)
      .maybeSingle();
    if (orderByStripe && orderByStripe.status !== "awaiting_payment") {
      return true;
    }
  }

  const stripePaid = await stripeReportsPaymentSucceeded(session);
  return stripePaid;
}

async function releaseSessionInventory(
  session: CheckoutSessionRow,
  reason: string,
): Promise<boolean> {
  const bundleSnapshot = isBundleCheckoutSnapshot(session.bundle_lines)
    ? session.bundle_lines
    : null;

  if (bundleSnapshot) {
    await releaseBundleLinesFromSnapshot(bundleSnapshot);
    await restoreBundleAfterCheckoutCancel(bundleSnapshot);
    INVENTORY_LIFECYCLE_LOG("release", {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason,
      detail: "bundle",
    });
    return true;
  }

  const result = await releaseProductInventory(session.listing_id, 1);
  INVENTORY_LIFECYCLE_LOG(result.released ? "release" : "skip", {
    listingId: session.listing_id,
    sessionId: session.id,
    publicId: session.public_id,
    reason: result.released ? reason : result.reason,
  });
  if (result.released) {
    INVENTORY_LIFECYCLE_LOG("restore", {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: "status=published reserved=false",
    });
  }
  return result.released;
}

export type CheckoutSessionDestroyResult = {
  /** True only when an open→terminal status write committed with affected rows > 0,
   *  OR when healing an already-terminal session and inventory release changed rows. */
  persisted: boolean;
  inventoryReleased: boolean;
  reason: string;
  affectedRows: number;
};

/**
 * Expire / cancel session + release inventory + expire Stripe session if any.
 * Absolute Law: reserved → published, reserved=false.
 *
 * Race-safe: claims open → terminal with status='open' AND order_id IS NULL.
 * Two workers never both release (only claim winner proceeds).
 * Paid order / Stripe success → skip restore (Order wins).
 *
 * Cod Sânge: never report success without DB persistence (affected rows > 0).
 */
export async function CHECKOUT_SESSION_ENGINE_destroy(input: {
  session: CheckoutSessionRow;
  status: "expired" | "cancelled";
}): Promise<CheckoutSessionDestroyResult> {
  const admin = createAdminClient();
  let session = input.session;
  const event: InventoryLifecycleEvent = input.status === "expired" ? "expire" : "cancel";
  let statusPersisted = false;
  let affectedRows = 0;

  if (session.status === "paid" || session.order_id) {
    INVENTORY_LIFECYCLE_LOG("skip", {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: "paid",
    });
    return { persisted: false, inventoryReleased: false, reason: "paid", affectedRows: 0 };
  }

  if (await sessionHasPaidOrder(session)) {
    INVENTORY_LIFECYCLE_LOG("skip", {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: "paid",
      detail: "order_or_stripe_success",
    });
    return {
      persisted: false,
      inventoryReleased: false,
      reason: "paid",
      affectedRows: 0,
    };
  }

  if (session.status === "open") {
    const now = new Date().toISOString();
    const claimQuery = await admin
      .from("checkout_sessions")
      .update({
        status: input.status,
        updated_at: now,
      })
      .eq("id", session.id)
      .eq("status", "open")
      .is("order_id", null)
      .select("*")
      .maybeSingle();
    const claimed = claimQuery.data;
    const claimError = claimQuery.error;

    if (claimError) {
      INVENTORY_LIFECYCLE_LOG("skip", {
        listingId: session.listing_id,
        sessionId: session.id,
        publicId: session.public_id,
        reason: "claim_error",
        detail: claimError.message,
      });
      return {
        persisted: false,
        inventoryReleased: false,
        reason: `claim_error:${claimError.message}`,
        affectedRows: 0,
      };
    }

    if (!claimed) {
      const { data: fresh } = await admin
        .from("checkout_sessions")
        .select("*")
        .eq("id", session.id)
        .maybeSingle();
      const current = fresh as CheckoutSessionRow | null;
      if (current && (await sessionHasPaidOrder(current))) {
        INVENTORY_LIFECYCLE_LOG("skip", {
          listingId: session.listing_id,
          sessionId: session.id,
          publicId: session.public_id,
          reason: "paid",
          detail: "race_lost_to_payment",
        });
        return {
          persisted: false,
          inventoryReleased: false,
          reason: "paid",
          affectedRows: 0,
        };
      }
      INVENTORY_LIFECYCLE_LOG("skip", {
        listingId: session.listing_id,
        sessionId: session.id,
        publicId: session.public_id,
        reason: "race_lost",
        detail: current?.status ?? "missing",
      });
      return {
        persisted: false,
        inventoryReleased: false,
        reason: `race_lost:${current?.status ?? "missing"}`,
        affectedRows: 0,
      };
    }

    // Prove persistence: re-read status must be terminal.
    const { data: proved } = await admin
      .from("checkout_sessions")
      .select("id, status, updated_at")
      .eq("id", session.id)
      .maybeSingle();
    if (!proved || proved.status !== input.status) {
      INVENTORY_LIFECYCLE_LOG("skip", {
        listingId: session.listing_id,
        sessionId: session.id,
        publicId: session.public_id,
        reason: "persist_verify_failed",
        detail: proved?.status ?? "missing",
      });
      return {
        persisted: false,
        inventoryReleased: false,
        reason: "persist_verify_failed",
        affectedRows: 0,
      };
    }

    statusPersisted = true;
    affectedRows = 1;
    session = claimed as CheckoutSessionRow;
    INVENTORY_LIFECYCLE_LOG(event, {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: input.status,
    });
  } else if (session.status === "expired" || session.status === "cancelled") {
    // Terminal unfinished session — heal inventory only (no second status write).
    INVENTORY_LIFECYCLE_LOG(event, {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: `heal_${session.status}`,
    });
  } else {
    INVENTORY_LIFECYCLE_LOG("skip", {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: `status_${session.status}`,
    });
    return {
      persisted: false,
      inventoryReleased: false,
      reason: `status_${session.status}`,
      affectedRows: 0,
    };
  }

  if (isStripeConfigured() && session.stripe_checkout_session_id) {
    try {
      await getStripeClient().checkout.sessions.expire(session.stripe_checkout_session_id);
    } catch {
      // already expired/consumed/paid
    }
  }

  // Re-check paid after Stripe expire attempt (webhook may have landed).
  if (await sessionHasPaidOrder(session)) {
    INVENTORY_LIFECYCLE_LOG("skip", {
      listingId: session.listing_id,
      sessionId: session.id,
      publicId: session.public_id,
      reason: "paid",
      detail: "post_claim_stripe",
    });
    return {
      persisted: statusPersisted,
      inventoryReleased: false,
      reason: "paid_post_claim",
      affectedRows,
    };
  }

  const inventoryReleased = await releaseSessionInventory(session, input.status);
  FINANCIAL_LOGGER("STOP", `checkout session ${input.status}=${session.public_id}`);

  const persisted = statusPersisted || inventoryReleased;
  if (!persisted) {
    return {
      persisted: false,
      inventoryReleased: false,
      reason: "no_db_change",
      affectedRows: 0,
    };
  }

  return {
    persisted: true,
    inventoryReleased,
    reason: input.status,
    affectedRows: affectedRows + (inventoryReleased ? 1 : 0),
  };
}

/**
 * Self-heal: any reserved listing without an active (open + unexpired) checkout
 * and without a paid order must return to published.
 * Counts restored ONLY when inventory release actually changed the DB.
 */
async function healOrphanedReservations(): Promise<{
  restored: number;
  failures: number;
}> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: reservedRows } = await admin
    .from("products")
    .select("id")
    .eq("status", "reserved");

  let restored = 0;
  let failures = 0;

  for (const row of reservedRows ?? []) {
    const listingId = row.id as string;

    const { data: activeOpen } = await admin
      .from("checkout_sessions")
      .select("id")
      .eq("listing_id", listingId)
      .eq("status", "open")
      .gt("expires_at", now)
      .limit(1)
      .maybeSingle();

    if (activeOpen) {
      continue;
    }

    const { data: paidSession } = await admin
      .from("checkout_sessions")
      .select("id, order_id, status, stripe_checkout_session_id, public_id")
      .eq("listing_id", listingId)
      .or("status.eq.paid,order_id.not.is.null")
      .limit(1)
      .maybeSingle();

    if (paidSession) {
      INVENTORY_LIFECYCLE_LOG("skip", {
        listingId,
        sessionId: paidSession.id,
        publicId: paidSession.public_id,
        reason: "paid",
        detail: "orphan_heal",
      });
      continue;
    }

    // Prefer releasing via a stale unfinished session (for structured session logs).
    const { data: staleSession } = await admin
      .from("checkout_sessions")
      .select("*")
      .eq("listing_id", listingId)
      .is("order_id", null)
      .in("status", ["open", "expired", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (staleSession) {
      const session = staleSession as CheckoutSessionRow;
      if (session.status === "open" && CHECKOUT_SESSION_ENGINE_isExpired(session.expires_at)) {
        const destroyed = await CHECKOUT_SESSION_ENGINE_destroy({
          session,
          status: "expired",
        });
        if (destroyed.persisted && destroyed.affectedRows > 0) {
          restored += 1;
        } else {
          failures += 1;
          INVENTORY_LIFECYCLE_LOG("skip", {
            listingId,
            sessionId: session.id,
            publicId: session.public_id,
            reason: "heal_destroy_failed",
            detail: destroyed.reason,
          });
        }
        continue;
      }
      if (session.status === "expired" || session.status === "cancelled") {
        const released = await releaseSessionInventory(session, `heal_${session.status}`);
        if (released) restored += 1;
        else failures += 1;
        continue;
      }
    }

    const result = await releaseProductInventory(listingId, 1);
    if (result.released) {
      INVENTORY_LIFECYCLE_LOG("restore", {
        listingId,
        reason: "orphan_reserved_no_active_checkout",
      });
      restored += 1;
    } else if (result.reason !== "already_published" && result.reason !== "sold") {
      failures += 1;
    }
  }

  return { restored, failures };
}

export async function CHECKOUT_SESSION_ENGINE_markPaid(input: {
  sessionId: string;
  orderId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("checkout_sessions")
    .update({
      status: "paid",
      order_id: input.orderId,
      paid_at: new Date().toISOString(),
      stripe_checkout_session_id: input.stripeSessionId ?? null,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId)
    .eq("status", "open");
}

export async function CHECKOUT_SESSION_ENGINE_attachStripe(input: {
  sessionId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("checkout_sessions")
    .update({
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId);
}

export type CheckoutSessionExpireAllResult = {
  expired: number;
  restored: number;
  failures: number;
  ok: boolean;
};

/**
 * Expire ALL open sessions past expires_at, then heal orphan reserved listings.
 * Crash recovery / abandon / TTL / duplicate workers → published once.
 *
 * Cod Sânge: expired/restored increment ONLY after DB persistence (affected rows > 0).
 */
export async function CHECKOUT_SESSION_ENGINE_expireAll(): Promise<CheckoutSessionExpireAllResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let expired = 0;
  let failures = 0;
  let cursorCreatedAt: string | null = null;
  const pageSize = 100;

  for (;;) {
    let query = admin
      .from("checkout_sessions")
      .select("*")
      .eq("status", "open")
      .lt("expires_at", now)
      .order("created_at", { ascending: true })
      .limit(pageSize);

    if (cursorCreatedAt) {
      query = query.gt("created_at", cursorCreatedAt);
    }

    const { data: rows, error: pageError } = await query;
    if (pageError) {
      FINANCIAL_LOGGER("STOP", `expireAll query failed: ${pageError.message}`);
      return { expired, restored: 0, failures: failures + 1, ok: false };
    }
    if (!rows?.length) break;

    for (const row of rows) {
      const result = await CHECKOUT_SESSION_ENGINE_destroy({
        session: row as CheckoutSessionRow,
        status: "expired",
      });
      if (result.persisted && result.affectedRows > 0) {
        expired += 1;
      } else {
        failures += 1;
        INVENTORY_LIFECYCLE_LOG("skip", {
          listingId: (row as CheckoutSessionRow).listing_id,
          sessionId: (row as CheckoutSessionRow).id,
          publicId: (row as CheckoutSessionRow).public_id,
          reason: "expire_not_persisted",
          detail: result.reason,
        });
      }
    }

    cursorCreatedAt = (rows[rows.length - 1] as CheckoutSessionRow).created_at;
    if (rows.length < pageSize) break;
  }

  const heal = await healOrphanedReservations();
  const restored = heal.restored;
  failures += heal.failures;
  const ok = failures === 0;
  FINANCIAL_LOGGER(
    "FINISHED",
    `sessions-expired=${expired} inventory-restored=${restored} failures=${failures} ok=${ok}`,
  );
  return { expired, restored, failures, ok };
}

/**
 * Canonical self-heal — call before every marketplace commerce entry.
 * Does not depend on daily cron. TTL Absolute Law = 120s.
 */
export async function CHECKOUT_SESSION_ENGINE_selfHeal(): Promise<CheckoutSessionExpireAllResult> {
  return CHECKOUT_SESSION_ENGINE_expireAll();
}

export function PAYMENT_INTENT_ENGINE_createShell(input: {
  checkoutSessionPublicId: string;
}): PaymentIntentShell | { ok: false; reason: string } {
  const key = input.checkoutSessionPublicId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  if (mustUseVirtualPayments()) {
    return {
      id: `pi_virtual_${key}`,
      checkoutSessionId: input.checkoutSessionPublicId,
      status: "READY",
      mode: "virtual",
    };
  }
  if (isStripeConfigured()) {
    return {
      id: `pi_pending_${key}`,
      checkoutSessionId: input.checkoutSessionPublicId,
      status: "PENDING_PAYMENT",
      mode: "stripe",
    };
  }
  if (isStripeRequired()) {
    return { ok: false, reason: "Payments are not configured." };
  }
  return {
    id: `pi_dev_${key}`,
    checkoutSessionId: input.checkoutSessionPublicId,
    status: "READY",
    mode: "dev",
  };
}

/** @deprecated Legacy order-bound shell — Master Architecture uses checkoutSessionPublicId. */
export function CHECKOUT_SESSION_ENGINE_createLegacy(input: {
  orderId: string;
  transactionId: string;
}): { id: string; orderId: string; transactionId: string; status: "PENDING_PAYMENT" } {
  return {
    id: `cs_legacy_${input.orderId.replace(/-/g, "").slice(0, 20)}`,
    orderId: input.orderId,
    transactionId: input.transactionId,
    status: "PENDING_PAYMENT",
  };
}
