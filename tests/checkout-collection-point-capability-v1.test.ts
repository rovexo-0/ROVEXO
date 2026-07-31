import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CHECKOUT_DELIVERY_CAPABILITIES,
  isCheckoutCollectionPointEnabled,
} from "@/lib/checkout/delivery-capabilities-v1";

describe("Checkout Collection Point UI capability flag", () => {
  it("hides Collection Point by default (temporary visual flag)", () => {
    expect(CHECKOUT_DELIVERY_CAPABILITIES.collectionPoint).toBe(false);
    expect(CHECKOUT_DELIVERY_CAPABILITIES.shipToHome).toBe(true);
    expect(isCheckoutCollectionPointEnabled()).toBe(false);
  });

  it("gates Collection Point render in CheckoutWizardV1 only", () => {
    const wizard = readFileSync(
      path.join(process.cwd(), "features/checkout/components/CheckoutWizardV1.tsx"),
      "utf8",
    );
    const flag = readFileSync(
      path.join(process.cwd(), "lib/checkout/delivery-capabilities-v1.ts"),
      "utf8",
    );
    expect(wizard).toContain("isCheckoutCollectionPointEnabled");
    expect(wizard).toContain("collectionPointEnabled");
    expect(wizard).toContain("Collection Point");
    expect(wizard).toContain("Ship to Home");
    expect(flag).toContain("collectionPoint: false");
    expect(flag).toContain("isServicePointEngineEnabled");
  });
});
