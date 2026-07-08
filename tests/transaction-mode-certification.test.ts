import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categoryTree } from "@/lib/categories/enterprise";
import { flattenCategoryPaths } from "@/lib/categories/queries";
import { validateMarketplaceTaxonomy } from "@/lib/categories/validate-taxonomy";
import {
  DIRECT_CONTACT_ROOT_SLUGS,
  getTransactionCapabilities,
  isDirectContactMode,
  isMarketplaceMode,
  isTransactionMode,
  parseTransactionMode,
  resolveTransactionModeForRootSlug,
  resolveTransactionModeFromFlatPath,
  TRANSACTION_MODES,
} from "@/lib/transaction-mode";

const ROOT = process.cwd();

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function walkTree(
  nodes: typeof categoryTree,
  visit: (node: (typeof categoryTree)[number], rootSlug: string) => void,
  rootSlug?: string,
) {
  for (const node of nodes) {
    const root = rootSlug ?? node.slug;
    visit(node, root);
    if (node.children?.length) walkTree(node.children, visit, root);
  }
}

describe("Transaction Mode — enterprise certification", () => {
  describe("database audit", () => {
    const migration = readSource("supabase/migrations/20250704100001_transaction_mode.sql");

    it("defines transaction_mode enum", () => {
      expect(migration).toMatch(/create type public\.transaction_mode as enum \('MARKETPLACE', 'DIRECT_CONTACT'\)/i);
    });

    it("adds NOT NULL column with MARKETPLACE default", () => {
      expect(migration).toMatch(/transaction_mode public\.transaction_mode not null default 'MARKETPLACE'/i);
    });

    it("migrates direct-contact root sectors and descendants", () => {
      expect(migration).toContain("'vehicles'");
      expect(migration).toContain("'property'");
      expect(migration).toContain("'jobs'");
      expect(migration).toContain("'services'");
      expect(migration).toMatch(/with recursive direct_contact_roots/i);
    });

    it("creates transaction_mode index", () => {
      expect(migration).toMatch(/categories_transaction_mode_idx/i);
    });
  });

  describe("canonical resolver audit", () => {
    it("accepts only MARKETPLACE and DIRECT_CONTACT", () => {
      expect(TRANSACTION_MODES).toEqual(["MARKETPLACE", "DIRECT_CONTACT"]);
      expect(isTransactionMode("MARKETPLACE")).toBe(true);
      expect(isTransactionMode("DIRECT_CONTACT")).toBe(true);
      expect(isTransactionMode("CHECKOUT")).toBe(false);
      expect(parseTransactionMode("invalid")).toBe("MARKETPLACE");
    });

    it("inherits mode from root slug on every flat path", () => {
      for (const path of flattenCategoryPaths()) {
        const mode = resolveTransactionModeFromFlatPath(path);
        expect(TRANSACTION_MODES).toContain(mode);
        if (DIRECT_CONTACT_ROOT_SLUGS.has(path.categorySlug)) {
          expect(mode).toBe("DIRECT_CONTACT");
        } else {
          expect(mode).toBe("MARKETPLACE");
        }
      }
    });

    it("stamps every tree node with inherited transactionMode", () => {
      walkTree(categoryTree, (node, rootSlug) => {
        const expected = resolveTransactionModeForRootSlug(rootSlug);
        expect(node.transactionMode).toBe(expected);
      });
    });

    it("passes marketplace taxonomy validation", () => {
      const report = validateMarketplaceTaxonomy(categoryTree);
      expect(report.valid).toBe(true);
      expect(report.issues).toHaveLength(0);
    });
  });

  describe("functional capabilities audit", () => {
    const marketplaceFlags = [
      "buyNow",
      "addToCart",
      "checkout",
      "payment",
      "wallet",
      "buyerProtection",
      "shipping",
      "shippingQuotes",
      "shippingLabel",
      "tracking",
      "orderStatus",
      "orderHistory",
    ] as const;

    const directHiddenFlags = [
      "buyNow",
      "addToCart",
      "checkout",
      "payment",
      "wallet",
      "buyerProtection",
      "shipping",
      "shippingQuotes",
      "shippingLabel",
      "tracking",
      "orderStatus",
      "orderHistory",
    ] as const;

    const directVisibleFlags = ["contactSeller", "messaging"] as const;

    it("enables full marketplace commerce", () => {
      const caps = getTransactionCapabilities("MARKETPLACE");
      expect(isMarketplaceMode(caps.mode)).toBe(true);
      for (const flag of marketplaceFlags) {
        expect(caps[flag], `MARKETPLACE.${flag}`).toBe(true);
      }
    });

    it("disables marketplace commerce for DIRECT_CONTACT", () => {
      const caps = getTransactionCapabilities("DIRECT_CONTACT");
      expect(isDirectContactMode(caps.mode)).toBe(true);
      for (const flag of directHiddenFlags) {
        expect(caps[flag], `DIRECT_CONTACT.${flag}`).toBe(false);
      }
      for (const flag of directVisibleFlags) {
        expect(caps[flag], `DIRECT_CONTACT.${flag}`).toBe(true);
      }
    });
  });

  describe("server security audit", () => {
    it("guards checkout against DIRECT_CONTACT listings", () => {
      const checkout = readSource("lib/orders/checkout.ts");
      expect(checkout).toContain("assertMarketplacePurchaseAllowedForProductSlug");
    });

    it("guards cart against DIRECT_CONTACT listings", () => {
      const cart = readSource("lib/cart/store.ts");
      expect(cart).toContain("assertMarketplacePurchaseAllowedForProductSlug");
    });

    it("resolves mode from category on products repository (not client input)", () => {
      const repo = readSource("lib/products/repository.ts");
      expect(repo).toContain("resolveTransactionModeMapForCategoryIds");
      expect(repo).not.toContain("categories:category_id ( transaction_mode )");
    });

    it("protects super-admin transaction mode updates", () => {
      const route = readSource("app/api/super-admin/categories/[id]/transaction-mode/route.ts");
      expect(route).toContain("requireApiSuperAdmin");
      expect(route).toContain("updateCategoryTransactionModeCascade");
    });

    it("strips marketplace shipping fields on direct-contact publish", () => {
      const listingsRoute = readSource("app/api/listings/route.ts");
      expect(listingsRoute).toContain("resolveTransactionModeFromCategoryPathPayload");
      expect(listingsRoute).toContain("isDirectContactMode");
    });
  });

  describe("UI single-page renderer audit", () => {
    it("uses capability engine on listing page (one page, dynamic layout)", () => {
      const page = readSource("features/product-detail/ProductDetailPage.tsx");
      expect(page).toContain("getTransactionCapabilities");
      expect(page).toContain("capabilities.shipping");
      expect(page).toContain("transactionMode={product.transactionMode}");
      expect(page).toContain('data-pd-detail-version="v1.1"');
    });

    it("switches action bar by transactionMode", () => {
      const bar = readSource("features/product-detail/ProductActionBarV1.tsx");
      expect(bar).toContain("Contact Seller");
      expect(bar).toContain("Buy Now");
      expect(bar).toContain("isDirectContactMode");
    });

    it("hides parcel size on sell form for DIRECT_CONTACT", () => {
      const form = readSource("features/sell/ui/SellShippingBlock.tsx");
      expect(form).toContain("resolveTransactionModeFromFlatPath");
      expect(form).toContain("directContact");
    });
  });

  describe("API exposure audit", () => {
    it("category tree route serves nodes with transactionMode", () => {
      const treeBuilder = readSource("lib/categories/build-tree-from-db.ts");
      expect(treeBuilder).toContain("transactionMode");
    });

    it("search listings expose transactionMode on products", () => {
      const search = readSource("lib/listings/repository.ts");
      expect(search).toContain("resolveTransactionModeMapForCategoryIds");
      expect(search).toContain("transactionMode:");
    });

    it("seller listing API includes transactionMode", () => {
      const types = readSource("lib/listings/types.ts");
      expect(types).toContain("transactionMode:");
    });

    it("product detail types require transactionMode", () => {
      const types = readSource("lib/products/types.ts");
      expect(types).toMatch(/transactionMode: import\("@\/lib\/transaction-mode\/types"\)\.TransactionMode/);
    });
  });

  describe("super admin audit", () => {
    it("registers transaction-mode in editor fields", () => {
      const registry = readSource("lib/enterprise-category-management-center/registry.ts");
      expect(registry).toContain('"transaction-mode"');
    });

    it("category editor renders transaction mode dropdown", () => {
      const admin = readSource(
        "features/super-admin/enterprise-category-management-center/EnterpriseCategoryManagementAdmin.tsx",
      );
      expect(admin).toContain("Transaction mode");
      expect(admin).toContain("/api/super-admin/categories/");
      expect(admin).toContain("transaction-mode");
    });

    it("cascade update propagates to descendants", () => {
      const server = readSource("lib/transaction-mode/server.ts");
      expect(server).toContain("getDescendantCategoryIds");
      expect(server).toContain("updateCategoryTransactionModeCascade");
    });
  });

  describe("sync-db audit", () => {
    it("persists transaction_mode on taxonomy sync", () => {
      const sync = readSource("lib/categories/sync-db.ts");
      expect(sync).toContain("transaction_mode:");
      expect(sync).toContain("inheritedMode");
    });
  });
});
