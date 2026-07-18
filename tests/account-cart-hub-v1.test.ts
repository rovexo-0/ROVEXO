import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Account + Cart canonical UI v1", () => {
  it("locks account hub markers", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");
    const settings = readSource("lib/account-center/settings-menu.ts");
    const css = readSource("styles/rovexo/account-canonical-v2.css");

    expect(home).toContain('data-ac-hub-version="v2.0-master"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountMenuSections");
    expect(menu).toContain("buildAccountMenuSections");
    expect(menu).toContain('title: "Buying"');
    expect(menu).toContain('title: "Selling"');
    expect(menu).toContain('title: "Business"');
    expect(menu).not.toContain("Personal Information");
    expect(settings).toContain('title: "ROVEXO Ideas"');
    expect(settings).toContain("/account/ideas");
    expect(menu).toContain("Sign Out");
    expect(css).toContain(".ac-canonical__followers");
    expect(css).toContain(".ac-canonical__section-card");
  });

  it("uses list rows instead of legacy account grid on hub", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    expect(home).not.toContain("MyAccountGrid");
    expect(home).not.toContain("AccountQuickAccessGrid");
    expect(home).not.toContain("ProfileCard");
  });

  it("hub menu rows include chevrons per canonical reference", () => {
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    const row = readSource("src/components/canonical/CanonicalMenuRow.tsx");
    expect(menu).toContain("CanonicalMenuRow");
    expect(row).toContain("ChevronRightLineIcon");
  });

  it("locks Personal Wallet Master Menu hub markers", () => {
    const wallet = readSource("features/wallet/components/WalletHubV1.tsx");
    const page = readSource("features/wallet/components/WalletPage.tsx");
    const withdraw = readSource("app/wallet/withdraw/page.tsx");

    expect(wallet).toContain('data-wallet-hub-version="v3.0-standard"');
    expect(wallet).toContain("CanonicalMenuRow");
    expect(wallet).toContain("PersonalWalletMenuSections");
    expect(wallet).toContain("Available");
    expect(wallet).toContain("Pending");
    expect(wallet).toContain("Withdraw");
    expect(wallet).not.toContain("Total earnings");
    expect(wallet).not.toContain("Platform Fee");
    expect(wallet).not.toContain("wallet-v2__hero");
    expect(wallet).not.toContain("wallet-v2__balance-card");
    expect(page).toContain("WalletHubV1");
    expect(withdraw).toContain("WithdrawPage");
  });

  it("locks cart v1 markers and checkout CTA", () => {
    const cart = readSource("features/cart/components/CartPage.tsx");
    const css = readSource("styles/rovexo/cart-v1.css");

    expect(cart).toContain('data-cart-version="v1.0"');
    expect(cart).toContain("Platform Fee");
    expect(cart).not.toContain("Buyer Protection Fee");
    expect(cart).toContain("Proceed to Checkout");
    expect(cart).toContain("Your Cart");
    expect(css).toContain(".cart-v1__platform-fee");
    expect(css).toContain(".cart-v1__checkout");
  });

  it("locks checkout foundation v1 markers", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const summary = readSource("features/checkout/components/OrderSummary.tsx");
    const price = readSource("features/checkout/components/CheckoutPriceSummary.tsx");
    const css = readSource("styles/rovexo/checkout-v1.css");
    const address = readSource("app/checkout/[slug]/address/page.tsx");
    const payment = readSource("app/checkout/[slug]/payment/page.tsx");
    const review = readSource("app/checkout/[slug]/review/page.tsx");

    expect(wizard).toContain('data-checkout-version="v1.0"');
    expect(wizard).toContain('data-checkout-sprint="3-qa"');
    expect(wizard).toContain('data-checkout-freeze="FROZEN"');
    expect(wizard).toContain("Confirm & Pay");
    expect(wizard).toContain("Continue to Payment");
    expect(wizard).toContain("CheckoutProductSummary");
    expect(wizard).toContain("CheckoutPriceSummary");
    expect(price).toContain("Platform Fee");
    expect(summary).toContain("Platform Fee");
    expect(summary).not.toContain("Buyer Protection Fee");
    expect(css).toContain(".ckt-v1__header");
    expect(css).toContain("height: 64px");
    expect(css).toContain("--ckt-max: 430px");
    expect(css).toContain(".ckt-v1__stepper");
    expect(address).toContain('initialStep="delivery"');
    expect(payment).toContain('initialStep="payment"');
    expect(review).toContain('initialStep="review"');
  });

  it("loads cart variation from database mapping", () => {
    const store = readSource("lib/cart/store.ts");
    expect(store).toContain("variation");
    expect(store).toContain("condition");
  });
});

describe("My Account module v1.0", () => {
  it("locks profile view markers", () => {
    const profile = readSource("features/account/components/ProfileEditPage.tsx");
    const route = readSource("app/account/profile/page.tsx");
    expect(profile).toContain("AccountCanonicalShell");
    expect(profile).toContain("Personal Information");
    expect(route).toContain("ProfileEditPage");
  });

  it("locks listings orders saved settings v1 routes", () => {
    const listingsRoute = readSource("app/seller/listings/page.tsx");
    expect(listingsRoute).toContain("SellerListingsV1");
    expect(listingsRoute).not.toContain("isSeller");
    expect(listingsRoute).toContain('dynamic = "force-dynamic"');
    expect(readSource("app/orders/page.tsx")).toContain("<OrdersPage");
    expect(readSource("app/saved/page.tsx")).toContain("SavedItemsV1");
    expect(readSource("app/account/reviews/page.tsx")).toContain("ReviewsV1");
    expect(readSource("app/account/settings/page.tsx")).toContain("SettingsV1");
    expect(readSource("app/account/verification/page.tsx")).toContain("VerificationHubPage");
    expect(readSource("styles/rovexo/account-module-v1.css")).toContain(".acm-tabs");
    expect(readSource("styles/rovexo/account-module-v1.css")).toContain(".acm-saved-grid");
  });
});
