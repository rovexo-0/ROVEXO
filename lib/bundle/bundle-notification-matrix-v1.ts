/**
 * Bundle Notification Matrix v1.0 — Owner Phase 1 emitters.
 * Emits via existing emitSmartNotification (no parallel notification system).
 */

import "server-only";

import { emitSmartNotification } from "@/lib/notifications/events";
import type { BundleCheckoutSnapshotV1 } from "@/lib/bundle/bundle-snapshot-v1";
import { BUNDLE_NOTIFICATION_MATRIX_V1 } from "@/lib/bundle/bundle-notification-matrix-ssot-v1";

export { BUNDLE_NOTIFICATION_MATRIX_V1 };

export async function notifyBundleCheckoutStarted(input: {
  buyerId: string;
  sellerId: string;
  snapshot: BundleCheckoutSnapshotV1;
  checkoutSessionPublicId: string;
}): Promise<void> {
  const count = input.snapshot.lines.length;
  const href = `/checkout/${input.snapshot.lines[0]!.slug}?cs=${input.checkoutSessionPublicId}`;

  void emitSmartNotification({
    userId: input.buyerId,
    eventType: "purchase_successful",
    idempotencyKey: `bundle-checkout-started:${input.checkoutSessionPublicId}`,
    notificationType: "order",
    title: "Checkout Started",
    subtitle: `Bundle · ${count} ${count === 1 ? "item" : "items"}`,
    detail: `£${input.snapshot.total.toFixed(2)}`,
    href,
    avatarUrl: input.snapshot.lines[0]?.imageUrl,
    avatarName: "Bundle",
    payload: { bundleId: input.snapshot.bundleId, phase: "checkout_started" },
  });
}

export async function notifyBundlePurchased(input: {
  buyerId: string;
  sellerId: string;
  snapshot: BundleCheckoutSnapshotV1;
  orderId: string;
  href: string;
}): Promise<void> {
  const count = input.snapshot.lines.length;

  void emitSmartNotification({
    userId: input.buyerId,
    eventType: "new_order",
    idempotencyKey: `bundle-order-buyer:${input.orderId}`,
    notificationType: "order",
    title: "Payment Successful",
    subtitle: `Order created · ${count} ${count === 1 ? "item" : "items"}`,
    detail: `£${input.snapshot.total.toFixed(2)}`,
    href: input.href,
    avatarUrl: input.snapshot.lines[0]?.imageUrl,
    avatarName: "Bundle",
    payload: { bundleId: input.snapshot.bundleId, orderId: input.orderId, phase: "paid" },
  });

  void emitSmartNotification({
    userId: input.sellerId,
    eventType: "new_order",
    idempotencyKey: `bundle-order-seller:${input.orderId}`,
    notificationType: "order",
    title: "Bundle Purchased",
    subtitle: `Prepare Order · ${count} ${count === 1 ? "item" : "items"}`,
    detail: `£${input.snapshot.itemPrice.toFixed(2)} item total`,
    href: input.href,
    avatarUrl: input.snapshot.lines[0]?.imageUrl,
    avatarName: "Bundle",
    payload: { bundleId: input.snapshot.bundleId, orderId: input.orderId, phase: "prepare" },
  });
}

export async function notifyBundleItemAdded(input: {
  buyerId: string;
  sellerId: string;
  bundleId: string;
  title: string;
  imageUrl?: string;
}): Promise<void> {
  void emitSmartNotification({
    userId: input.buyerId,
    eventType: "favorite_price_changed",
    idempotencyKey: `bundle-added:${input.bundleId}:${Date.now()}`,
    notificationType: "system",
    title: "Added to Bundle",
    subtitle: input.title,
    href: "/bundle/review",
    avatarUrl: input.imageUrl,
    avatarName: "Bundle",
    payload: { bundleId: input.bundleId, phase: "added" },
  });

  void emitSmartNotification({
    userId: input.sellerId,
    eventType: "new_offer",
    idempotencyKey: `bundle-seller-created:${input.bundleId}`,
    notificationType: "system",
    title: "Bundle Created",
    subtitle: "A buyer started a bundle with your listings",
    href: "/inbox",
    avatarUrl: input.imageUrl,
    avatarName: "Bundle",
    payload: { bundleId: input.bundleId, phase: "seller_bundle_created" },
  });
}
