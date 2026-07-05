import { describe, expect, it } from "vitest";
import {
  ACCOUNT_QUICK_ACCESS,
  getAccountModuleTiles,
  getBuyerModuleTiles,
  getBusinessModuleTiles,
  getSellerModuleTiles,
} from "@/lib/account-center/modules";
import type { UserProfile } from "@/lib/profile/types";

const profile: UserProfile = {
  id: "user-1",
  fullName: "Test User",
  username: "testuser",
  email: "test@example.com",
  verified: true,
  memberSince: "2024",
  role: "buyer",
  accountType: "buyer",
  isSeller: true,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

describe("Account Center modules", () => {
  it("exposes exactly four quick access modules", () => {
    expect(ACCOUNT_QUICK_ACCESS).toHaveLength(4);
    expect(ACCOUNT_QUICK_ACCESS.map((entry) => entry.id)).toEqual([
      "buyer",
      "seller",
      "business",
      "account",
    ]);
  });

  it("routes quick access to official module destinations", () => {
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "buyer")?.href).toBe("/buyer");
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "seller")?.href).toBe("/seller");
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "business")?.href).toBe(
      "/business/dashboard",
    );
    expect(ACCOUNT_QUICK_ACCESS.find((entry) => entry.id === "account")?.href).toBe(
      "/account/settings",
    );
  });

  it("keeps buyer module free of seller-only destinations", () => {
    const hrefs = getBuyerModuleTiles().map((tile) => tile.href);
    expect(hrefs).not.toContain("/seller/listings");
    expect(hrefs).toContain("/orders");
    expect(hrefs).toContain("/messages");
  });

  it("seller module lists Bring Your Item without hub self-link", () => {
    const hrefs = getSellerModuleTiles().map((tile) => tile.href);
    expect(hrefs).toContain("/import");
    expect(hrefs).toContain("/sell");
    expect(hrefs).not.toContain("/seller");
  });

  it("buyer module matches v1.0 spec tiles", () => {
    const labels = getBuyerModuleTiles().map((tile) => tile.label);
    expect(labels).toContain("Trust Centre");
    expect(labels).toContain("Resolution Centre");
    expect(labels).toContain("Premium");
    expect(labels).not.toContain("Offers");
  });

  it("account module matches v1.0 spec", () => {
    const labels = getAccountModuleTiles().map((tile) => tile.label);
    const hrefs = getAccountModuleTiles().map((tile) => tile.href);
    expect(labels).toContain("Profile");
    expect(labels).toContain("Security");
    expect(labels).toContain("Payment Methods");
    expect(labels).toContain("Help");
    expect(hrefs).not.toContain("/account/settings");
  });

  it("business module includes VAT and company dashboard", () => {
    const labels = getBusinessModuleTiles(profile).map((tile) => tile.label);
    expect(labels).toContain("Company Dashboard");
    expect(labels).toContain("VAT");
    expect(labels).toContain("Business Profile");
  });
});
