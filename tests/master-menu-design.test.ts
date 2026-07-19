import { describe, expect, it } from "vitest";
import { buildBuyingMenuSections, BUYING_HUB_INTRO } from "@/lib/account-center/buying-menu";
import { buildBusinessMenuSections } from "@/lib/account-center/business-menu";
import { buildSellingMenuSections, SELLING_HUB_INTRO } from "@/lib/account-center/selling-menu";
import { buildMessagesMenuSections } from "@/lib/account-center/messages-menu";
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

  it("routes Messages to Messages hub", () => {
    const messages = buildAccountMenuSections(profile)
      .flatMap((s) => s.items)
      .find((i) => i.id === "messages");
    expect(messages?.href).toBe("/inbox");
  });
});

describe("Master Menu Design — Buying", () => {
  it("locks PO Buying hub rows", () => {
    expect(BUYING_HUB_INTRO).toBe("Manage everything you buy.");
    const titles = buildBuyingMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "My Orders",
      "Tracking",
      "Reviews",
      "Refunds",
      "Disputes",
      "Saved",
      "Recently Viewed",
    ]);
  });
});

describe("Master Menu Design — Selling", () => {
  it("locks PO Selling hub rows", () => {
    expect(SELLING_HUB_INTRO).toBe("Manage everything you sell.");
    const titles = buildSellingMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Listings",
      "Orders",
      "Reviews",
      "Shipping",
      "Returns",
      "Performance",
      "Compliance",
      "Bring Your Item",
      "Connectors",
    ]);
  });
});

describe("Master Menu Design — Business", () => {
  it("locks PO Business hub rows", () => {
    const titles = buildBusinessMenuSections("demo-store").flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual([
      "Orders",
      "Inventory",
      "Analytics",
      "Reviews",
      "Wallet",
      "VAT",
      "Directory",
    ]);
  });
});

describe("Master Menu Design — Messages Transaction Hub", () => {
  it("locks Absolute Final Transaction Hub rows", () => {
    const titles = buildMessagesMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual([
      "Inbox",
      "Orders",
      "Tracking",
      "Messages",
      "Reviews",
      "Support",
      "Refunds",
      "Disputes",
    ]);
  });
});

describe("Wallet architecture — PO Absolute Final", () => {
  it("Personal Wallet destinations", () => {
    const titles = buildPersonalWalletMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual(["Transactions", "Personal Bank", "Business Bank"]);
  });

  it("Business Wallet destinations", () => {
    const titles = buildBusinessWalletMenuSections().flatMap((s) => s.items.map((i) => i.title));
    expect(titles).toEqual(["Transactions", "Personal Bank", "Business Bank"]);
  });
});
