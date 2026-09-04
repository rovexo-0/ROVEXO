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

describe("Master Menu Design — Profile main", () => {
  it("exposes Profile menu without Business hub", () => {
    const titles = buildAccountMenuSections(profile, { activeListingCount: 1 }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual([
      "Favourites",
      "Balance",
      "My Orders",
      "Holiday Mode",
      "Promote",
      "Settings",
      "Rovexo Ideas",
      "Theme",
    ]);
    expect(titles.filter((t) => t.includes("Business"))).toHaveLength(0);
  });

  it("routes Favourites and Orders to existing surfaces", () => {
    const items = buildAccountMenuSections(profile).flatMap((s) => s.items);
    expect(items.find((i) => i.id === "favourites")?.href).toBe("/saved");
    expect(items.find((i) => i.id === "my-orders")?.href).toBe("/orders");
    expect(items.find((i) => i.id === "settings")?.href).toBe("/account/settings");
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
      "Seller setup",
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
      "Wallet",
      "VAT",
      "Store",
      "Promote",
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
    const titles = buildPersonalWalletMenuSections({ isBusinessVerified: true }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual(["Transactions", "Payment Methods", "Bank Accounts"]);
  });

  it("Business Wallet destinations", () => {
    const titles = buildBusinessWalletMenuSections({ isBusinessVerified: true }).flatMap((s) =>
      s.items.map((i) => i.title),
    );
    expect(titles).toEqual(["Transactions", "Payment Methods", "Bank Accounts"]);
  });
});
