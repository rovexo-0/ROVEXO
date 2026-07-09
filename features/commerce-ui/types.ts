/**
 * ROVEXO Commerce UI — canonical Checkout / Order Details / Tracking types.
 *
 * These are presentation-layer types shared across the three UI-locked screens.
 * Money values are in major units (GBP, e.g. 375.00).
 */

export type CommerceMoney = number;

export type CommerceLineItem = {
  id: string;
  title: string;
  quantity: number;
  /** Line total (unit price × quantity). */
  price: CommerceMoney;
  imageUrl: string | null;
};

export type CommerceSellerGroup = {
  sellerId: string;
  sellerName: string;
  items: CommerceLineItem[];
};

/**
 * Canonical checkout totals. The platform never exposes the fee percentage,
 * shipping-label count or parcel count at checkout — only the single combined
 * shipping price and the flat Platform Fee.
 */
export type CommerceTotals = {
  products: CommerceMoney;
  shipping: CommerceMoney;
  platformFee: CommerceMoney;
  total: CommerceMoney;
};

export type CheckoutStepId = "cart" | "shipping" | "payment" | "review";

export type ParcelStatus =
  | "preparing"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export type CommerceParcelTimelineEvent = {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  current: boolean;
  done: boolean;
};

export type ParcelOperation = "return" | "claim" | "lost" | "damaged";

export type CommerceParcel = {
  id: string;
  /** 1-based parcel position within the order. */
  index: number;
  /** Total parcels in the order — always rendered as "Parcel X of Y". */
  totalParcels: number;
  status: ParcelStatus;
  carrier: string;
  trackingNumber: string | null;
  /** Pre-formatted estimated delivery date, e.g. "6 May 2025". */
  estimatedDelivery: string | null;
  trackingUrl?: string | null;
  /** Products allocated to this parcel — never mixed across parcels. */
  items: CommerceLineItem[];
  /** Active parcel-level operation, independent of carrier tracking status. */
  operation: ParcelOperation | null;
  timeline?: CommerceParcelTimelineEvent[];
};

/** One seller's shipment group — parcels from different sellers are never mixed. */
export type CommerceSellerShipment = {
  sellerId: string;
  sellerName: string;
  parcelCount: number;
  shipmentReady: boolean;
  parcels: CommerceParcel[];
  trackingHref: string;
};

export type OrderPaymentStatus = "paid" | "pending" | "refunded";

export type CommerceOrderMeta = {
  orderNumber: string;
  /** Pre-formatted placement timestamp, e.g. "2 May 2025 at 09:41". */
  placedAt: string;
  itemCount: number;
  paymentStatus: OrderPaymentStatus;
  invoiceHref?: string;
};
