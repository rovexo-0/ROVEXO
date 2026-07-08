import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("shipping certification checkout wiring", () => {
  it("does not gate live quotes on server env vars in the client bundle", () => {
    const delivery = readFileSync(path.join(process.cwd(), "lib/checkout/delivery.ts"), "utf8");
    expect(delivery).not.toContain("getConfiguredProviders");
    expect(delivery).not.toContain("SHIPPO_API_KEY");
    expect(delivery).toContain("resolveLiveDeliveryQuotes");
  });

  it("passes server-side Shippo configuration into checkout", () => {
    const checkoutPage = readFileSync(
      path.join(process.cwd(), "app/checkout/[slug]/page.tsx"),
      "utf8",
    );
    expect(checkoutPage).toContain("isShippoConfigured");
    expect(checkoutPage).toContain("liveShippingEnabled");
  });

  it("uses shipping included copy for seller-paid delivery", () => {
    const delivery = readFileSync(path.join(process.cwd(), "lib/checkout/delivery.ts"), "utf8");
    expect(delivery).toContain("SHIPPING_INCLUDED_LABEL");
  });
});

describe("business dashboard stability", () => {
  it("uses Avatar fallback instead of raw Image for business profile logo", () => {
    const source = readFileSync(
      path.join(process.cwd(), "features/business/dashboard/components/BusinessProfileCard.tsx"),
      "utf8",
    );
    expect(source).toContain("Avatar");
    expect(source).not.toMatch(/<Image[\s\S]*companyLogoUrl/);
  });

  it("uses ProductRowImage for inventory rows", () => {
    const source = readFileSync(
      path.join(process.cwd(), "features/business/inventory/components/BusinessInventoryPage.tsx"),
      "utf8",
    );
    expect(source).toContain("ProductRowImage");
  });
});
