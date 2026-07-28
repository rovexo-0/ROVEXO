import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    expect(labels).toContain("My Orders");
    expect(labels).toContain("Tracking");
    expect(labels).toContain("Reviews");
  });

  it("selling module includes import destinations when Bring Your Item is enabled", () => {
    const labels = getSellingModuleTiles().map((tile) => tile.label);
    const hrefs = getSellingModuleTiles().map((tile) => tile.href);
    expect(labels).toContain("Bring Your Item");
    expect(labels).toContain("Connectors");
    expect(labels).toContain("Listings");
    expect(labels).toContain("Compliance");
    expect(labels).not.toContain("Payouts");
    expect(hrefs).toContain("/account/bring-your-item");
    expect(hrefs).toContain("/seller/connectors");
  });

  it("buying module matches Absolute Final Master Menu destinations", () => {
    const labels = getBuyingModuleTiles().map((tile) => tile.label);
    expect(labels).toEqual([
      "My Orders",
      "Tracking",
      "Reviews",
      "Refunds",
      "Disputes",
      "Saved",
      "Recently Viewed",
    ]);
  });

  it("ROVEXO Ideas lives on Profile menu only (not account module tiles)", () => {
    const labels = getAccountModuleTiles().map((tile) => tile.label);
    const hrefs = getAccountModuleTiles().map((tile) => tile.href);
    expect(labels).toContain("Profile");
    expect(labels).toContain("Security");
    expect(labels).not.toContain("Rovexo Ideas");
    expect(labels).not.toContain("ROVEXO Ideas");
    expect(hrefs).not.toContain("/account/ideas");
    expect(hrefs).not.toContain("/account/settings");

    const menu = readFileSync(
      join(process.cwd(), "lib/account-center/canonical-menu.ts"),
      "utf8",
    );
    expect(menu).toContain('title: "Rovexo Ideas"');
    expect(menu).toContain("/account/ideas");
  });
});
