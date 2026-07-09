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
    const css = readSource("styles/rovexo/account-hub-v1.css");

    expect(home).toContain('data-ac-hub-version="v1.4"');
    expect(home).toContain("AccountHubProfile");
    expect(home).toContain("AccountMenuList");
    expect(menu).toContain("Profile");
    expect(menu).toContain("Selling");
    expect(menu).toContain("Cart");
    expect(menu).toContain("Verification");
    expect(menu).toContain("ROVEXO Ideas");
    expect(menu).toContain("Log Out");
    expect(css).toContain(".ac-hub__menu-card");
    expect(css).toContain(".ac-hub__row-chevron");
    expect(css).toContain(".ac-hub__profile-card");
    expect(css).toContain(".ac-hub__wallet-balance");
    expect(css).toContain(".ac-hub__submenu");
  });

  it("uses list rows instead of legacy account grid on hub", () => {
    const home = readSource("features/account-center/components/AccountCenterHome.tsx");
    expect(home).not.toContain("MyAccountGrid");
    expect(home).not.toContain("AccountQuickAccessGrid");
    expect(home).not.toContain("ProfileCard");
  });

  it("hub menu rows include chevrons per canonical reference", () => {
    const row = readSource("features/account-center/components/AccountMenuRow.tsx");
    expect(row).toContain("ChevronRightLineIcon");
  });

  it("locks wallet hub markers", () => {
    const wallet = readSource("features/wallet/components/WalletHubV1.tsx");
    const page = readSource("features/wallet/components/WalletPage.tsx");

    expect(wallet).toContain('data-wallet-hub-version="v1.0"');
    expect(wallet).toContain("Available Balance");
    expect(wallet).toContain("Recent Transactions");
    expect(wallet).toContain("Payment Methods");
    expect(wallet).toContain("wallet-hub__amount--in");
    expect(wallet).toContain("wallet-hub__amount--out");
    expect(page).toContain("WalletHubV1");
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

  it("locks stepped checkout v1 markers", () => {
    const wizard = readSource("features/checkout/components/CheckoutWizardV1.tsx");
    const summary = readSource("features/checkout/components/OrderSummary.tsx");
    const css = readSource("styles/rovexo/checkout-v1.css");

    expect(wizard).toContain('data-checkout-version="v1.0"');
    expect(wizard).toContain("CheckoutStepper");
    expect(wizard).toContain("Continue to Payment");
    expect(wizard).toContain("Place Order");
    expect(summary).toContain("Platform Fee");
    expect(summary).not.toContain("Buyer Protection Fee");
    expect(css).toContain(".ckt-v1__stepper");
  });

  it("loads cart variation from database mapping", () => {
    const store = readSource("lib/cart/store.ts");
    expect(store).toContain("variation");
    expect(store).toContain("condition");
  });
});

describe("My Account module v1.0", () => {
  it("locks profile view markers", () => {
    const profile = readSource("features/account-module/components/ProfileViewV1.tsx");
    const route = readSource("app/account/profile/page.tsx");
    expect(profile).toContain('data-profile-version="v1.0"');
    expect(profile).toContain("Edit Profile");
    expect(route).toContain("ProfileViewV1");
  });

  it("locks listings orders saved settings v1 routes", () => {
    const listingsRoute = readSource("app/seller/listings/page.tsx");
    expect(listingsRoute).toContain("SellerListingsV1");
    expect(listingsRoute).not.toContain("isSeller");
    expect(listingsRoute).toContain('dynamic = "force-dynamic"');
    expect(readSource("app/orders/page.tsx")).toContain("OrdersV1");
    expect(readSource("app/saved/page.tsx")).toContain("SavedItemsV1");
    expect(readSource("app/account/settings/page.tsx")).toContain("SettingsV1");
    expect(readSource("app/account/verification/page.tsx")).toContain("VerificationHubV1");
    expect(readSource("styles/rovexo/account-module-v1.css")).toContain(".acm-tabs");
    expect(readSource("styles/rovexo/account-module-v1.css")).toContain(".acm-saved-grid");
  });
});
