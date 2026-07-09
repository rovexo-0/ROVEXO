import { afterEach, describe, expect, it, vi } from "vitest";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import {
  filterBringYourItemNavLinks,
  filterBringYourItemTiles,
  isBringYourItemEnabled,
} from "@/lib/bring-your-item/release";
import { buildAccountMenu } from "@/lib/account-center/canonical-menu";
import { getSellingModuleTiles } from "@/lib/account-center/modules";
import { getSellHubTiles } from "@/lib/mobile-ui/hubs";
import { resolveAccountCapabilities, ROVEXO_ACCOUNT_KIND } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";

const baseProfile: UserProfile = {
  id: "user-1",
  email: "seller@example.com",
  username: "seller",
  fullName: "Seller",
  avatarUrl: null,
  role: "seller",
  verified: true,
  memberSince: "2024-01-01",
  accountKind: ROVEXO_ACCOUNT_KIND,
  accountType: ROVEXO_ACCOUNT_KIND,
  capabilities: resolveAccountCapabilities({
    role: "seller",
    verified: true,
    hasSellerProfile: true,
    hasBusinessAccount: false,
  }),
  isSeller: true,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

function stubProductionDisabled() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED", "false");
  vi.stubEnv("BRING_YOUR_ITEM_ENABLED", "false");
  vi.stubEnv("PLAYWRIGHT_E2E", "");
  vi.stubEnv("VITEST", "");
}

describe("Bring Your Item release policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to disabled in production without an explicit flag", () => {
    stubProductionDisabled();
    vi.stubEnv("NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED", "");
    vi.stubEnv("BRING_YOUR_ITEM_ENABLED", "");

    expect(isBringYourItemEnabled()).toBe(false);
  });

  it("enables when NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED", "true");
    vi.stubEnv("VITEST", "");

    expect(isBringYourItemEnabled()).toBe(true);
  });

  it("shows Coming Soon in My Account when disabled", () => {
    stubProductionDisabled();

    const byi = buildAccountMenu(baseProfile).find((item) => item.id === "bring-your-item");
    expect(byi?.comingSoon).toBe(true);
    expect(byi?.href).toBeUndefined();
    expect(byi?.subtitle).toBe("Coming Soon");
  });

  it("exposes the live route in My Account when enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BRING_YOUR_ITEM_ENABLED", "true");
    vi.stubEnv("VITEST", "");

    const byi = buildAccountMenu(baseProfile).find((item) => item.id === "bring-your-item");
    expect(byi?.comingSoon).toBeFalsy();
    expect(byi?.href).toBe(BRING_YOUR_ITEM_PATH);
  });

  it("hides BYI from public navigation surfaces when disabled", () => {
    stubProductionDisabled();

    const sellingTiles = getSellingModuleTiles();
    const sellHubTiles = getSellHubTiles(baseProfile);
    const navLinks = filterBringYourItemNavLinks([
      { href: BRING_YOUR_ITEM_PATH, label: "Bring Your Items" },
      { href: "/seller", label: "Selling" },
    ]);

    expect(sellingTiles.some((tile) => tile.href === BRING_YOUR_ITEM_PATH)).toBe(false);
    expect(sellHubTiles.some((tile) => tile.href === BRING_YOUR_ITEM_PATH)).toBe(false);
    expect(navLinks.some((link) => link.href === BRING_YOUR_ITEM_PATH)).toBe(false);
    expect(filterBringYourItemTiles([{ href: BRING_YOUR_ITEM_PATH, label: "BYI", subtitle: "" }])).toEqual([]);
  });
});
