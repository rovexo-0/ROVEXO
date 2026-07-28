import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PRIMARY_BUTTON_DOM,
  PRIMARY_BUTTON_FORBIDDEN_HEIGHTS_PX,
  PRIMARY_BUTTON_TOKENS,
  PRIMARY_BUTTON_VERSION,
  primaryButtonSnapshot,
} from "@/lib/design-system/primary-button-v1";
import { MY_ACCOUNT_PRIMARY_BUTTON } from "@/lib/design-system/my-account-primary-button-v1";
import { MASTER_FULL_WIDTH_TOKENS } from "@/lib/master-engine/master-full-width-contract-v1";
import { PROFILE_MASTER_FULL_WIDTH } from "@/lib/design-system/profile-master-tokens";
import { resolveBackRoute } from "@/lib/navigation/back-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Global Button Recovery v1.0 — PrimaryButton functional geometry", () => {
  it("locks 56px height · 16px radius · 16/600 · full width · purple", () => {
    expect(PRIMARY_BUTTON_VERSION).toBe("v1.1-recovery");
    expect(PRIMARY_BUTTON_DOM).toBe("v1.0-global-primary");
    expect(PRIMARY_BUTTON_TOKENS.heightPx).toBe(56);
    expect(PRIMARY_BUTTON_TOKENS.radiusPx).toBe(16);
    expect(PRIMARY_BUTTON_TOKENS.fontSizePx).toBe(16);
    expect(PRIMARY_BUTTON_TOKENS.fontWeight).toBe(600);
    expect(PRIMARY_BUTTON_TOKENS.paddingInlinePx).toBe(24);
    expect(PRIMARY_BUTTON_TOKENS.width).toBe("100%");
    expect(PRIMARY_BUTTON_FORBIDDEN_HEIGHTS_PX).toEqual([20]);
    expect(primaryButtonSnapshot().goldenRule).toContain("56px");
  });

  it("aligns Profile / My Account / Full Width primary tokens", () => {
    expect(MY_ACCOUNT_PRIMARY_BUTTON.heightPx).toBe(56);
    expect(MY_ACCOUNT_PRIMARY_BUTTON.radiusPx).toBe(16);
    expect(PROFILE_MASTER_FULL_WIDTH.buttonHeightPx).toBe(56);
    expect(PROFILE_MASTER_FULL_WIDTH.buttonRadiusPx).toBe(16);
    expect(MASTER_FULL_WIDTH_TOKENS.primaryButtonPx).toBe(56);
    expect(MASTER_FULL_WIDTH_TOKENS.radiusPx).toBe(16);
  });

  it("ships PrimaryButton component + CSS SSOT", () => {
    const ui = readSource("components/ui/PrimaryButton.tsx");
    const css = readSource("styles/rovexo/primary-button-v1.css");
    const canonical = readSource("src/components/canonical/CanonicalButton.tsx");
    const index = readSource("styles/rovexo/index.css");
    expect(ui).toContain("data-primary-button");
    expect(ui).toContain("rx-primary-button");
    expect(css).toContain('[data-primary-button="v1.0-global-primary"]');
    expect(css).toContain("--rx-primary-height: 56px");
    expect(css).toContain("--rx-primary-radius: 16px");
    expect(css).toContain("--rx-primary-font-size: 16px");
    expect(css).toContain("--rx-primary-pad-x: 24px");
    expect(css).toContain(".rx-primary-button");
    expect(css).toContain(".cds-button--primary");
    expect(css).not.toContain("--rx-primary-height: 20px");
    expect(canonical).toContain('variant === "primary"');
    expect(canonical).toContain("PrimaryButton");
    expect(index).toContain("primary-button-v1.css");
    expect(readSource("features/orders/components/OrdersPage.tsx")).toContain("PrimaryButtonLink");
  });

  it("keeps Wallet Production Withdraw on hero and PrimaryButton on payment methods", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const payments = readSource("features/wallet/components/WalletPaymentMethodsPage.tsx");
    expect(hub).toContain("Withdraw");
    expect(hub).toContain("wallet-v2__hero-btn--primary");
    expect(hub).toContain("WALLET_ROUTES.withdraw");
    expect(payments).toContain("PrimaryButton");
    expect(payments).toContain("Add Card");
  });

  it("keeps wallet child back routes on Balance parent (not Home / 404)", () => {
    expect(resolveBackRoute("/wallet/payment-methods")).toEqual({
      parentHref: "/balance",
      label: "Balance",
    });
    expect(resolveBackRoute("/wallet/bank-accounts")).toEqual({
      parentHref: "/balance",
      label: "Balance",
    });
    expect(resolveBackRoute("/wallet/withdraw")).toEqual({
      parentHref: "/balance",
      label: "Balance",
    });
    expect(resolveBackRoute("/wallet/transactions")).toEqual({
      parentHref: "/balance",
      label: "Balance",
    });
    expect(resolveBackRoute("/orders")).toEqual({
      parentHref: "/account",
      label: "My Account",
    });
  });
});
