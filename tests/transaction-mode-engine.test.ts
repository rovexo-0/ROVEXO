import { describe, expect, it } from "vitest";
import { categoryTree, ENTERPRISE_SECTORS } from "@/lib/categories/enterprise";
import { flattenCategoryPaths } from "@/lib/categories/queries";
import {
  DIRECT_CONTACT_ROOT_SLUGS,
  getTransactionCapabilities,
  isDirectContactMode,
  isMarketplaceMode,
  resolveTransactionModeForRootSlug,
  resolveTransactionModeFromFlatPath,
  TRANSACTION_MODES,
} from "@/lib/transaction-mode";

describe("transaction mode engine", () => {
  it("allows only MARKETPLACE and DIRECT_CONTACT", () => {
    expect(TRANSACTION_MODES).toEqual(["MARKETPLACE", "DIRECT_CONTACT"]);
  });

  it("assigns DIRECT_CONTACT to classified root sectors", () => {
    for (const slug of DIRECT_CONTACT_ROOT_SLUGS) {
      expect(resolveTransactionModeForRootSlug(slug)).toBe("DIRECT_CONTACT");
    }
  });

  it("defaults marketplace roots to MARKETPLACE", () => {
    expect(resolveTransactionModeForRootSlug("electronics")).toBe("MARKETPLACE");
    expect(resolveTransactionModeForRootSlug("home-garden")).toBe("MARKETPLACE");
  });

  it("stamps enterprise tree nodes with inherited transaction modes", () => {
    const vehicles = categoryTree.find((node) => node.slug === "vehicles");
    const electronics = categoryTree.find((node) => node.slug === "electronics");

    expect(vehicles?.transactionMode).toBe("DIRECT_CONTACT");
    expect(electronics?.transactionMode).toBe("MARKETPLACE");
    const vehiclePath = flattenCategoryPaths().find((path) => path.categorySlug === "vehicles");
    const marketplacePath = flattenCategoryPaths().find((path) => path.categorySlug === "electronics");

    expect(vehiclePath && resolveTransactionModeFromFlatPath(vehiclePath)).toBe("DIRECT_CONTACT");
    expect(marketplacePath && resolveTransactionModeFromFlatPath(marketplacePath)).toBe("MARKETPLACE");
  });

  it("gates marketplace capabilities correctly", () => {
    const marketplace = getTransactionCapabilities("MARKETPLACE");
    const direct = getTransactionCapabilities("DIRECT_CONTACT");

    expect(isMarketplaceMode("MARKETPLACE")).toBe(true);
    expect(isDirectContactMode("DIRECT_CONTACT")).toBe(true);

    expect(marketplace.checkout).toBe(true);
    expect(marketplace.addToCart).toBe(true);
    expect(marketplace.shipping).toBe(true);

    expect(direct.checkout).toBe(false);
    expect(direct.addToCart).toBe(false);
    expect(direct.shipping).toBe(false);
    expect(direct.contactSeller).toBe(true);
    expect(direct.messaging).toBe(true);
  });

  it("covers every enterprise sector root", () => {
    for (const sector of ENTERPRISE_SECTORS) {
      const mode = resolveTransactionModeForRootSlug(sector.slug);
      expect(TRANSACTION_MODES).toContain(mode);
    }
  });
});
