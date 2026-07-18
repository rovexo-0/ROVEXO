import { describe, expect, it } from "vitest";
import {
  ACCOUNT_QUICK_ACCESS,
  getAccountModuleTiles,
  getBuyingModuleTiles,
  getSellingModuleTiles,
} from "@/lib/account-center/modules";

describe("Account Center modules", () => {
  it("exposes three quick access surfaces on one ROVEXO account", () => {
    expect(ACCOUNT_QUICK_ACCESS).toHaveLength(3);
    expect(ACCOUNT_QUICK_ACCESS.map((entry) => entry.id)).toEqual(["buying", "selling", "account"]);
  });

  it("routes quick access to official module destinations", () => {
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "buying")?.href).toBe("/account/buying");
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "selling")?.href).toBe("/seller");
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "account")?.href).toBe(
      "/account/settings",
    );
  });

  it("keeps buying module free of selling-only destinations", () => {
    const hrefs = getBuyingModuleTiles().map((tile) => tile.href);
    const labels = getBuyingModuleTiles().map((tile) => tile.label);
    expect(hrefs).not.toContain("/seller/listings");
    expect(labels).toContain("Orders");
    expect(labels).toContain("Offers");
    expect(labels).toContain("Reviews");
  });

  it("selling module excludes Marketplace Import and Bring Your Item", () => {
    const labels = getSellingModuleTiles().map((tile) => tile.label);
    const hrefs = getSellingModuleTiles().map((tile) => tile.href);
    expect(labels).not.toContain("Marketplace Import");
    expect(labels).not.toContain("Bring Your Item");
    expect(labels).toContain("Listings");
    expect(labels).toContain("Wallet");
    expect(labels).not.toContain("Payouts");
    expect(hrefs).not.toContain("/account/bring-your-item");
  });

  it("buying module matches PO Master Menu destinations", () => {
    const labels = getBuyingModuleTiles().map((tile) => tile.label);
    expect(labels).toEqual([
      "Orders",
      "Cart",
      "Saved",
      "Offers",
      "Returns & Refunds",
      "Reviews",
    ]);
  });

  it("account module includes ROVEXO Ideas", () => {
    const labels = getAccountModuleTiles().map((tile) => tile.label);
    const hrefs = getAccountModuleTiles().map((tile) => tile.href);
    expect(labels).toContain("Profile");
    expect(labels).toContain("Security");
    expect(labels).toContain("ROVEXO Ideas");
    expect(hrefs).toContain("/account/ideas");
    expect(hrefs).not.toContain("/account/settings");
  });
});
