import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCheckoutDraft } from "@/features/checkout/types";
import { getDefaultPaymentMethod } from "@/lib/checkout/payment";

describe("checkout address flow", () => {
  it("maps saved default address id to checkout draft addressId", () => {
    const draft = createCheckoutDraft(
      {
        addressId: "addr-123",
        recipientName: "John Smith",
        addressLine: "81 Darlaston Road",
        postcode: "WS2 9RD",
        country: "United Kingdom",
      },
      getDefaultPaymentMethod(),
    );

    expect(draft.addressId).toBe("addr-123");
  });

  it("getDefaultCheckoutAddress returns addressId for saved defaults", () => {
    const source = readFileSync("lib/checkout/address.ts", "utf8");
    expect(source).toContain("addressId: saved.id");
    expect(source).not.toContain("id: saved.id");
  });

  it("resolves delivery address during delivery step only", () => {
    const hook = readFileSync("features/checkout/hooks/use-checkout-form.ts", "utf8");
    expect(hook).toContain("resolveDeliveryAddress");
    expect(hook).toContain("/api/checkout/shipping-address");
    expect(hook).not.toContain('fetch("/api/addresses"');
  });

  it("placeOrder uses addressId without saving an address", () => {
    const hook = readFileSync("features/checkout/hooks/use-checkout-form.ts", "utf8");
    const placeOrderBlock = hook.slice(hook.indexOf("const placeOrder"));
    expect(placeOrderBlock).toContain("const shippingAddressId = draft.addressId");
    expect(placeOrderBlock).not.toContain("/api/addresses");
    expect(placeOrderBlock).not.toContain("/api/checkout/shipping-address");
  });

  it("keeps duplicate rejection only on explicit address book create", () => {
    const source = readFileSync("lib/addresses/repository.ts", "utf8");
    const resolveBlock = source.slice(
      source.indexOf("export async function resolveCheckoutShippingAddress"),
      source.indexOf("async function clearDefaultAddresses"),
    );
    expect(resolveBlock).not.toContain("This address is already saved.");
    expect(source).toMatch(/export async function createUserAddress[\s\S]*?throw new Error\("This address is already saved\."\)/);
  });
});
