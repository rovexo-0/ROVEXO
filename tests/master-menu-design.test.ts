import { describe, expect, it } from "vitest";
import { buildBuyingMenuSections } from "@/lib/account-center/buying-menu";
import { buildBusinessMenuSections } from "@/lib/account-center/business-menu";
import { buildSellingMenuSections } from "@/lib/account-center/selling-menu";
import {
  buildBusinessWalletMenuSections,
  buildPersonalWalletMenuSections,
} from "@/lib/account-center/wallet-menus";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";

const profile = {
  id: "u1",
  capabilities: resolveAccountCapabilities({
    role: "buyer",
    verified: true,
    hasSellerProfile: true,
    hasBusinessAccount: true,
  }),
  accountKind: ROVEXO_ACCOUNT_KIND,
} as UserProfile;

describe("Master Menu Design — My Account", () => {
  it("exposes Buying / Selling / Business hubs without duplicate wallets", () => {
    const titles = buildAccountMenuSections(profile).flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Buying",
      "Selling",
      "Business",
      "Wallet",
      "Messages",
      "Notifications",
      "Verification",
      "Settings",
      "Help Centre",
      "Trust Centre",
      "Legal Centre",
    ]);
    expect(titles.filter((t) => t.includes("Wallet"))).toHaveLength(1);
  });
});

describe("Master Menu Design — Buying", () => {
  it("includes PO Buying destinations with One Feature = One Entry Point", () => {
    const titles = buildBuyingMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Orders",
      "Cart",
      "Saved",
      "Offers",
      "Returns & Refunds",
      "Reviews",
    ]);
    expect(titles).not.toContain("Tracking");
    expect(titles).not.toContain("Refunds");
  });
});

describe("Master Menu Design — Selling", () => {
  it("includes PO Selling destinations without Import or AI", () => {
    const titles = buildSellingMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Listings",
      "Orders",
      "Wallet",
      "Analytics",
      "Promotions",
      "Offers",
      "Review Center",
      "Returns & Refunds",
    ]);
    expect(titles).not.toContain("Marketplace Import");
    expect(titles).not.toContain("AI Assistant");
    expect(titles).not.toContain("Payouts");
  });
});

describe("Master Menu Design — Business", () => {
  it("includes PO Business destinations without Wallet/Payouts duplicate", () => {
    const titles = buildBusinessMenuSections("demo-store").flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual([
      "Store",
      "Orders",
      "Wallet",
      "Analytics",
      "Promotions",
      "Followers",
      "Reviews",
      "Verification",
      "Policies",
      "Returns & Refunds",
    ]);
    expect(titles.filter((t) => t === "Payouts")).toHaveLength(0);
  });

  it("links Store to public storefront when slug is present", () => {
    const store = buildBusinessMenuSections("acme-uk")
      .flatMap((s) => s.items)
      .find((i) => i.id === "store");
    expect(store?.href).toBe("/store/acme-uk");
  });
});

describe("Wallet architecture — max 2 wallets", () => {
  it("Personal Wallet exposes PO destinations", () => {
    const titles = buildPersonalWalletMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Buying",
      "Selling",
      "Personal Bank Account",
      "Transactions",
      "Withdraw",
      "Pending Funds",
      "Payout History",
    ]);
  });

  it("Business Wallet exposes PO destinations", () => {
    const titles = buildBusinessWalletMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Business Orders",
      "Business Transactions",
      "Business Promotions",
      "Business Payouts",
      "Business Bank Account",
      "VAT Documents",
    ]);
  });
});
