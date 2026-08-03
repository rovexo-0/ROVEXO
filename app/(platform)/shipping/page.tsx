import { redirect } from "next/navigation";

/**
 * Shipping Engine v1.0 Scope Lock — `/shipping` is not a live destination.
 * Tracking + labels live in Conversation Hub. Hub UI deferred to v1.1.
 * SSOT: lib/shipping/shipping-engine-v1-scope-lock.ts
 */
export default function ShippingRoute() {
  redirect("/orders");
}
