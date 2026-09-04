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

    expect(home).toContain('data-ac-hub-version="profile-v1"');
    expect(home).toContain("AccountCanonicalProfile");
    expect(home).toContain("AccountMenuSections");
    expect(menu).toContain("buildAccountMenuSections");
    expect(menu).toContain('title: "Favourites"');
    expect(menu).toContain('title: "My Orders"');
    expect(menu).toContain('title: "Balance"');
    expect(menu).not.toContain("Personal Information");
    expect(menu).toContain('title: "Rovexo Ideas"');
    expect(menu).toContain("/account/ideas");
    expect(settings).not.toContain('title: "Rovexo Ideas"');
    expect(settings).not.toContain('title: "ROVEXO Ideas"');
    expect(menu).toContain("Sign Out");
    expect(css).not.toContain(".ac-canonical__followers");
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
    const withdraw = readSource("app/(platform)/wallet/withdraw/page.tsx");

    expect(wallet).toContain('data-wallet-hub-version="v1.0-canonical"');
    expect(wallet).toContain("wallet-v2__hero");
    expect(wallet).toContain("BALANCE_PAGE_NAME");
    expect(wallet).toContain("Available Balance");
    expect(wallet).toContain("Pending");
    expect(wallet).toContain("Withdraw");
    expect(wallet).not.toContain("Total earnings");
    expect(wallet).not.toContain("Platform Fee");
    expect(wallet).not.toContain("Buyer Protection");
    expect(wallet).not.toContain("balance-v1__available");
    expect(wallet).not.toContain('title="Wallet"');
    expect(page).toContain("WalletHubV1");
    expect(withdraw).toContain("WithdrawPage");
  });

  it("locks cart v1 markers and checkout CTA", () => {
    const cart = readSource("features/cart/components/CartPage.tsx");
    const css = readSource("styles/rovexo/cart-v1.css");

    expect(cart).toContain('data-cart-version="v1.0"');
    expect(cart).toContain("Buyer Protection");
    expect(cart).not.toContain("Buyer Protection Fee");
    expect(cart).toContain("Checkout");
    expect(cart).toContain("Cart (");
    expect(css).toContain(".cart-v1__platform-fee");
    expect(css).toContain(".cart-v1__checkout");
  });

  it("locks checkout foundation v1 markers", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const summary = readSource("features/checkout/components/OrderSummary.tsx");
    const price = readSource("features/checkout/components/CheckoutPriceSummary.tsx");
    const css = readSource("styles/rovexo/checkout-v1.css");
    const address = readSource("app/(platform)/checkout/[slug]/address/page.tsx");
    const payment = readSource("app/(platform)/checkout/[slug]/payment/page.tsx");
    const review = readSource("app/(platform)/checkout/[slug]/review/page.tsx");

    expect(wizard).toContain('data-checkout-version="v1.0"');
    expect(wizard).toContain('data-checkout-sprint="3-qa"');
    expect(wizard).toContain('data-checkout-freeze="CHECKOUT_UI_v1.0"');
    expect(wizard).toContain("TOTAL PAY");
    expect(wizard).not.toContain("Pay Securely");
    expect(wizard).not.toContain("Continue to Payment");
    expect(wizard).toContain("CheckoutProductSummary");
    expect(wizard).toContain("CheckoutPriceSummary");
    expect(wizard).toContain("Product");
    expect(wizard).toContain("Delivery option");
    expect(wizard).toContain('data-checkout-freeze="CHECKOUT_UI_v1.0"');
    expect(price).toContain("Buyer Protection");
    expect(summary).toContain("Buyer Protection");
    expect(summary).not.toContain("Buyer Protection Fee");
    expect(css).toContain(".ckt-v1__header");
    expect(css).toContain("height: 64px");
    expect(css).toContain("--ckt-max: 100%");
    expect(address).toContain("redirect");
    expect(payment).toContain("redirect");
    expect(review).toContain("redirect");
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
    const route = readSource("app/(platform)/account/profile/page.tsx");
    expect(profile).toContain("MyAccountTemplate");
    expect(profile).toContain("Profile Photo");
    expect(route).toContain("ProfileEditPage");
    expect(route).toContain("MyAccountTemplate");
  });

  it("locks listings orders saved settings v1 routes", () => {
    const listingsRoute = readSource("app/(platform)/seller/listings/page.tsx");
    expect(listingsRoute).toContain("SellerListingsV1");
    expect(listingsRoute).not.toContain("isSeller");
    expect(listingsRoute).toContain('dynamic = "force-dynamic"');
    expect(readSource("app/(platform)/orders/page.tsx")).toContain("<OrdersPage");
    expect(readSource("app/(platform)/saved/page.tsx")).toContain("SavedItemsV1");
    expect(readSource("app/(platform)/account/reviews/page.tsx")).toContain("ReviewsV1");
    expect(readSource("app/(platform)/account/settings/page.tsx")).toContain("SettingsV1");
    expect(readSource("app/(platform)/account/verification/page.tsx")).toContain("VerificationHubPage");
    expect(readSource("styles/rovexo/account-module-v1.css")).toContain(".acm-tabs");
    expect(readSource("styles/rovexo/account-module-v1.css")).toContain(".acm-saved-grid");
  });
});
