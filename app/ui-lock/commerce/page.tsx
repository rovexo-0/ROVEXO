import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { PhoneFrame } from "@/features/commerce-ui/preview/PhoneFrame";
import { CheckoutView } from "@/features/commerce-ui/views/CheckoutView";
import { OrderDetailsView } from "@/features/commerce-ui/views/OrderDetailsView";
import { TrackingView } from "@/features/commerce-ui/views/TrackingView";
import {
  MOCK_LINE_ITEMS,
  MOCK_ORDER_META,
  MOCK_PARCELS,
  MOCK_PARCEL_COUNT,
  MOCK_SELLER_GROUP,
  MOCK_TOTALS,
} from "@/features/commerce-ui/mock/ui-lock-mock";

export const metadata = {
  title: "Checkout & Tracking UI Lock | ROVEXO",
  robots: { index: false, follow: false },
};

/**
 * UI-lock preview — renders all three canonical screens side-by-side for
 * pixel-perfect review against the provided mockup.
 */
export default function CommerceUiLockPreviewPage() {
  return (
    <div className="rx-page min-h-screen bg-background px-ds-4 py-ds-8">
      <header className="mx-auto mb-ds-8 max-w-6xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">UI Lock v1.0</p>
        <h1 className="mt-ds-2 text-2xl font-bold text-text-primary">
          Checkout, Order Details &amp; Tracking
        </h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Canonical commerce surfaces — mobile-first, design-system driven, no custom inline styles.
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-ds-8 lg:grid-cols-3">
        <PhoneFrame label="Screen 1 — Checkout">
          <CheckoutView
            step="payment"
            sellerGroups={[MOCK_SELLER_GROUP]}
            totals={MOCK_TOTALS}
            preview
          />
        </PhoneFrame>

        <PhoneFrame label="Screen 2 — Order Details">
          <OrderDetailsView
            meta={MOCK_ORDER_META}
            items={MOCK_LINE_ITEMS}
            totals={MOCK_TOTALS}
            parcelCount={MOCK_PARCEL_COUNT}
            shipmentReady
            trackingHref="/ui-lock/commerce/tracking"
          />
          <BottomNavigation active="account" visible />
        </PhoneFrame>

        <PhoneFrame label="Screen 3 — Tracking">
          <TrackingView
            orderNumber={MOCK_ORDER_META.orderNumber}
            itemCount={MOCK_ORDER_META.itemCount}
            sellerName={MOCK_SELLER_GROUP.sellerName}
            parcels={MOCK_PARCELS}
            orderHref="/ui-lock/commerce/order"
          />
          <BottomNavigation active="account" visible />
        </PhoneFrame>
      </div>
    </div>
  );
}
