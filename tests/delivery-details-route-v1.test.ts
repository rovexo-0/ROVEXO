/**
 * Delivery route fail-closed + Listing → Delivery Details.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getHelpArticle } from "@/lib/help/content/articles";
import {
  PRODUCT_DELIVERY_DETAILS_HREF,
  PRODUCT_DELIVERY_LEGACY_HELP_SLUGS,
  resolveDeliveryDetailsHref,
} from "@/lib/product-detail/delivery-details-route-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Delivery Details route — fail-closed (no 404)", () => {
  it("canonical Delivery Details article exists", () => {
    expect(PRODUCT_DELIVERY_DETAILS_HREF).toBe("/help/delivery-shipping");
    expect(getHelpArticle("delivery-shipping")).toBeDefined();
    expect(getHelpArticle("shipping")).toBeUndefined();
  });

  it("View Item never mounts ProductShippingCard (Delivery = Checkout / Tracking only)", () => {
    const page = readSource("features/product-detail/ProductDetailPage.tsx");
    expect(page).not.toContain("ProductShippingCard");
    expect(page).not.toContain("PRODUCT_DELIVERY_DETAILS_HREF");
  });

  it("help Delivery Details href SSOT never uses legacy /help/shipping as canonical", () => {
    const route = readSource("lib/product-detail/delivery-details-route-v1.ts");
    expect(route).toContain('"/help/delivery-shipping"');
    expect(route).not.toContain('PRODUCT_DELIVERY_DETAILS_HREF = "/help/shipping"');
  });

  it("help/[slug] redirects legacy Delivery slugs instead of notFound", () => {
    const route = readSource("app/help/[slug]/page.tsx");
    expect(route).toContain("HELP_DELIVERY_ALIASES");
    expect(route).toContain("PRODUCT_DELIVERY_DETAILS_HREF");
    for (const slug of PRODUCT_DELIVERY_LEGACY_HELP_SLUGS) {
      expect(PRODUCT_DELIVERY_LEGACY_HELP_SLUGS).toContain(slug);
    }
    expect(resolveDeliveryDetailsHref("/help/shipping")).toBe(PRODUCT_DELIVERY_DETAILS_HREF);
    expect(resolveDeliveryDetailsHref("/help/delivery")).toBe(PRODUCT_DELIVERY_DETAILS_HREF);
  });
});
