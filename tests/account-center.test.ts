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
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "buying")?.href).toBe("/orders");
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "selling")?.href).toBe("/seller");
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "account")?.href).toBe(
      "/account/settings",
    );
  });

  it("keeps buying module free of selling-only destinations", () => {
    const hrefs = getBuyingModuleTiles().map((tile) => tile.href);
    expect(hrefs).not.toContain("/seller/listings");
    expect(hrefs).toContain("/orders");
    expect(hrefs).toContain("/messages");
  });

  it("selling module lists Bring Your Item without hub self-link", () => {
    const hrefs = getSellingModuleTiles().map((tile) => tile.href);
    expect(hrefs).toContain("/account/bring-your-item");
    expect(hrefs).toContain("/sell");
    expect(hrefs).not.toContain("/seller");
  });

  it("buying module matches v2.1 spec tiles", () => {
    const labels = getBuyingModuleTiles().map((tile) => tile.label);
    expect(labels).toContain("Trust Centre");
    expect(labels).toContain("Resolution Centre");
    expect(labels).toContain("Premium");
    expect(labels).not.toContain("Offers");
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
