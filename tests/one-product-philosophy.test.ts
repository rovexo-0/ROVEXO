import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("One Product Philosophy Freeze", () => {
  it("locks AccountIcon stroke and shared menu icon box", () => {
    const icons = readSource("components/account/AccountIcons.tsx");
    const cds = readSource("styles/rovexo/canonical-ds.css");
    expect(icons).toContain("strokeWidth: 1.9");
    expect(cds).toContain("--cds-row-min-height: 56px");
    expect(cds).toContain("--cds-icon-size: 20px");
  });

  it("Settings uses AccountIcon — same icon system as My Account", () => {
    const icon = readSource("features/account-module/components/SettingsMenuIcon.tsx");
    expect(icon).toContain("AccountIcon");
    expect(icon).not.toContain("RvxLineIcons");
  });

  it("Help uses AccountIcon", () => {
    const help = readSource("features/help/components/HelpCentreCanonicalSection.tsx");
    const page = readSource("features/help/components/HelpCentrePage.tsx");
    expect(help).toContain("AccountIcon");
    expect(page).toContain("AccountIcon");
    expect(help).not.toContain("RvxLineIcons");
  });

  it("Resolution uses CanonicalMenuRow not legacy ac-canonical__row", () => {
    const resolution = readSource("features/resolution/components/ResolutionCentreView.tsx");
    expect(resolution).toContain("CanonicalMenuRow");
    expect(resolution).toContain("AccountIcon");
    expect(resolution).not.toContain("ac-canonical__row");
  });

  it("Seller Trust has no score-meter hero", () => {
    const sellerTrust = readSource("features/trust/components/SellerTrustDashboard.tsx");
    expect(sellerTrust).toContain("CanonicalMenuRow");
    expect(sellerTrust).not.toContain("TrustScoreMeter");
  });

  it("Trust Centre sections use AccountIcon names not emoji", () => {
    const types = readSource("lib/trust/types.ts");
    expect(types).toContain('icon: "verification"');
    expect(types).not.toContain("⭐");
  });

  it("Withdraw and Transactions use CanonicalMenuRow", () => {
    const withdraw = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const txns = readSource("features/wallet/components/WalletTransactionsList.tsx");
    expect(withdraw).toContain("CanonicalMenuRow");
    expect(withdraw).toContain("AccountIcon");
    expect(txns).toContain("CanonicalMenuRow");
  });

  it("Checkout and Product Detail lock 100% phone width", () => {
    const checkout = readSource("styles/rovexo/checkout-v1.css");
    const pd = readSource("styles/rovexo/product-detail-v1.css");
    const freeze = readSource("styles/rovexo/phone-width-v1-freeze.css");
    expect(checkout).toContain("--ckt-max: 100%");
    expect(pd).toContain("width: 100%");
    expect(freeze).toContain(".pd-v1__shell");
    expect(freeze).toContain("--ckt-max: 100%");
  });

  it("Cart and Saved do not override shell to !px-2", () => {
    const cart = readSource("features/cart/components/CartPage.tsx");
    const saved = readSource("features/account-module/components/SavedItemsV1.tsx");
    expect(cart).not.toContain('contentClassName="!px-2');
    expect(saved).not.toContain('contentClassName="!px-2');
  });

  it("Search overlay has no glass effects", () => {
    const search = readSource("features/search/components/SearchOverlay.tsx");
    expect(search).not.toContain("rx-glass");
    expect(search).not.toContain("rx-glow");
  });

  it("Inbox notifications use CanonicalMenuRow", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("CanonicalMenuRow");
    expect(inbox).toContain("AccountIcon");
    expect(inbox).not.toContain("inbox-hub__notif-card");
  });

  it("Tracking uses AccountIcon not lucide Package", () => {
    const tracking = readSource("features/commerce-ui/views/TrackingView.tsx");
    expect(tracking).toContain("AccountIcon");
    expect(tracking).not.toContain('from "lucide-react"');
    expect(tracking).not.toContain("InfoBannerCard");
  });

  it("Reviews use CanonicalMenuRow only", () => {
    const reviews = readSource("features/account-module/components/ReviewsV1.tsx");
    expect(reviews).toContain("CanonicalMenuRow");
    expect(reviews).not.toContain("<Avatar");
  });

  it("Messages is Transaction Hub intro", () => {
    const menu = readSource("lib/account-center/messages-menu.ts");
    expect(menu).toContain("Transaction hub");
    expect(menu).toContain("Inbox");
    expect(menu).toContain("Disputes");
  });

  it("Checkout is Confirm & Pay only — no wizard steps", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    expect(wizard).toContain("Confirm & Pay");
    expect(wizard).toContain("Products");
    expect(wizard).toContain("Shipping");
    expect(wizard).not.toContain("Continue to Payment");
    expect(wizard).not.toContain("CheckoutDeliveryStepV1");
    expect(wizard).not.toContain("CheckoutPaymentStepV1");
    expect(wizard).toContain('data-checkout-freeze="ABSOLUTE-FINAL"');
  });

  it("Parcel freeze — four options only", () => {
    const sell = readSource("features/sell/types.ts");
    const parcels = readSource("lib/shipping/parcels.ts");
    const ops = readSource("features/commerce-ui/components/ParcelOperations.tsx");
    const store = readSource("features/store/components/ProStorePage.tsx");
    expect(sell).toContain("Small Parcel");
    expect(sell).toContain("Extra Large Parcel");
    expect(sell).not.toContain('"custom"');
    expect(parcels).toContain("Extra Large Parcel");
    expect(parcels).not.toContain('label: "Letter"');
    expect(ops).toContain("CanonicalMenuRow");
    expect(ops).not.toContain("weightKg");
    expect(ops).not.toContain("dimensions");
    expect(store).toContain("DiscoveryPageShell");
    expect(store).toContain("CanonicalMenuRow");
    expect(store).not.toContain("max-w-");
  });

  it("Order Details and Tracking stay on frozen field lists", () => {
    const order = readSource("features/commerce-ui/views/OrderDetailsView.tsx");
    const tracking = readSource("features/commerce-ui/views/TrackingView.tsx");
    expect(order).toContain("Payment status");
    expect(order).toContain("Support");
    expect(order).not.toContain("OrderPlacedBanner");
    expect(tracking).not.toContain("NeedHelpCard");
    expect(tracking).toContain('showOperations={false}');
  });

  it("Inbox conversation rows are product-first without swipe", () => {
    const inbox = readSource("features/inbox/components/InboxPage.tsx");
    expect(inbox).toContain("conversation.product?.title");
    expect(inbox).not.toContain("SwipeableConversationRow");
  });

  it("ConversationHub is Transaction Hub — no chat attach sheet / typing / avatars", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("Message about this order");
    expect(hub).not.toContain("signalTyping");
    expect(hub).not.toContain("attachSheetOpen");
    expect(hub).not.toContain('from "@/components/ui/Avatar"');
    expect(hub).not.toContain("Share listing");
    expect(hub).not.toContain("Video");
  });

  it("Fluency3DIcon renders line icons — no 3D picture assets", () => {
    const fluency = readSource("components/icons/Fluency3DIcon.tsx");
    expect(fluency).toContain("RvxLineIcons");
    expect(fluency).not.toContain("<picture");
    expect(fluency).not.toContain("getFluency3DAssetPath");
  });

  it("Button variants have no glass", () => {
    const variants = readSource("components/ui/variants.ts");
    expect(variants).not.toContain("rx-glass");
    expect(variants).not.toContain("backdrop-blur");
  });
});
