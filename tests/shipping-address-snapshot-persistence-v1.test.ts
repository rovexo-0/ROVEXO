/**
 * Address snapshot persistence: checkout reference → fulfillment → shipping_records.
 * Does not change quote identity, prices, V3 mapping, or cancel/wallet/refund paths.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const ensureShippingRecord = vi.fn();
const getShippingRecord = vi.fn();
const saveShippingQuotes = vi.fn();
const updateShippingQuotePayloadWithoutReplacing = vi.fn();
const listShipmentParcelsForOrder = vi.fn();
const createShipmentParcel = vi.fn();
const fetchShippingQuotesServer = vi.fn();
const createAdminFrom = vi.fn();
const shippingUpdate = vi.fn();
const shippingFrom = vi.fn();

vi.mock("@/lib/shipping/store", () => ({
  ensureShippingRecord: (...args: unknown[]) => ensureShippingRecord(...args),
  getShippingRecord: (...args: unknown[]) => getShippingRecord(...args),
  saveShippingQuotes: (...args: unknown[]) => saveShippingQuotes(...args),
  updateShippingQuotePayloadWithoutReplacing: (...args: unknown[]) =>
    updateShippingQuotePayloadWithoutReplacing(...args),
}));

vi.mock("@/lib/shipping/parcels-repository", () => ({
  listShipmentParcelsForOrder: (...args: unknown[]) => listShipmentParcelsForOrder(...args),
  createShipmentParcel: (...args: unknown[]) => createShipmentParcel(...args),
}));

vi.mock("@/lib/shipping/pricing/service.server", () => ({
  fetchShippingQuotesServer: (...args: unknown[]) => fetchShippingQuotesServer(...args),
}));

vi.mock("@/lib/full-demo/security", () => ({
  mustUseDemoShipping: () => false,
}));

vi.mock("@/lib/shipping/db-client", () => ({
  createShippingAdminClient: () => ({
    from: (...args: unknown[]) => shippingFrom(...args),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => createAdminFrom(...args),
  }),
}));

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
}));

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function adminChain(data: unknown = null) {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get(target, prop) {
      if (prop === "then") return undefined;
      if (prop === "maybeSingle" || prop === "single") {
        return async () => ({ data, error: null });
      }
      if (!(prop in target)) {
        target[prop as string] = vi.fn(() => self);
      }
      return target[prop as string];
    },
  });
  return self;
}

const SELECTED_QUOTE_ID = "sendcloud:29631";
const QUOTE_ROW_ID = "0936d54c-171e-4eb7-8014-6ddadb02d9a8";

const baseOrder = {
  id: "ord-future-1",
  order_number: "RVXADDR",
  status: "awaiting_shipment",
  buyer_id: "b1",
  seller_id: "s1",
  item_price: 10,
  delivery_fee: 2.38,
  delivery_carrier: "Royal Mail",
  shipping_address_id: "addr-delivery-1",
  selected_shipping_quote_id: SELECTED_QUOTE_ID,
  selected_shipping_quote_payload: {
    externalQuoteId: SELECTED_QUOTE_ID,
    v2MethodId: 29631,
    shippingOptionCode: "royal_mailv2:tracked_24/size=s",
    quoteApiVersion: "v2+v3" as const,
  },
  order_items: [
    {
      product_id: "p1",
      title: "Item",
      image_url: "/x.png",
      quantity: 1,
      slug: "item",
    },
  ],
};

describe("shipping address snapshot persistence v1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    shippingUpdate.mockResolvedValue({ error: null });
    shippingFrom.mockImplementation(() => ({
      update: (...args: unknown[]) => {
        shippingUpdate(...args);
        return { eq: vi.fn(async () => ({ error: null })) };
      },
    }));

    createAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") return adminChain({ full_name: "Seller" });
      if (table === "shipping_addresses") {
        return adminChain({
          recipient_name: "Recipient",
          address_line: "10 Example Street",
          address_line_2: null,
          city: "London",
          postcode: "SW1A 1AA",
          country: "GB",
        });
      }
      if (table === "products") return adminChain({ parcel_size: "small" });
      if (table === "orders") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
          select: vi.fn(() => adminChain(null)),
        };
      }
      return adminChain(null);
    });

    const record = {
      id: "sr-1",
      orderId: "ord-future-1",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: "Royal Mail",
      collectionAddress: {
        role: "collection",
        postcode: "E1 6AN",
        country: "GB",
      },
      deliveryAddress: {
        role: "delivery",
        postcode: "SW1A 1AA",
        country: "GB",
      },
      pricing: {
        quotes: [
          {
            id: SELECTED_QUOTE_ID,
            quoteRowId: QUOTE_ROW_ID,
            providerId: "sendcloud",
            carrier: "Royal Mail",
            serviceName: "Royal Mail",
            pricePence: 238,
            currency: "GBP",
            estimatedDays: { min: 1, max: 5 },
            v2MethodId: 29631,
            shippingOptionCode: "royal_mailv2:tracked_24/size=s",
          },
        ],
        selectedQuoteId: SELECTED_QUOTE_ID,
        currency: "GBP",
        providerAvailable: true,
      },
    };
    ensureShippingRecord.mockResolvedValue(record);
    getShippingRecord.mockResolvedValue(record);
    saveShippingQuotes.mockResolvedValue(record);
    updateShippingQuotePayloadWithoutReplacing.mockResolvedValue(record);
    listShipmentParcelsForOrder.mockResolvedValue([{ id: "parcel-1" }]);
    createShipmentParcel.mockResolvedValue({ id: "parcel-1" });
    fetchShippingQuotesServer.mockResolvedValue({
      quotes: [],
      selectedQuoteId: null,
      currency: "GBP",
      providerAvailable: true,
    });
  });

  it("A: checkout → fulfillment carries shippingAddressId only (no street snapshot in Stripe metadata)", () => {
    const checkout = read("lib/orders/checkout.ts");
    expect(checkout).toContain("shippingAddressId: input.shippingAddressId");
    expect(checkout).toContain("shippingQuoteId: selectedShippingQuoteId");
    const stripeSession = checkout.slice(
      checkout.lastIndexOf("const stripeSession = await stripe.checkout.sessions.create"),
      checkout.indexOf("if (!stripeSession.url)"),
    );
    expect(stripeSession).toContain("shippingAddressId: input.shippingAddressId");
    expect(stripeSession).toContain("shippingQuoteId: selectedShippingQuoteId");
    expect(stripeSession).not.toContain("collectionAddress");
    expect(stripeSession).not.toContain("deliveryAddress");
    expect(stripeSession).not.toContain("collection_address");
    expect(stripeSession).not.toContain("delivery_address");

    const webhook = read("lib/stripe/webhook-handler.ts");
    expect(webhook).toContain("shippingAddressId: paymentIntent.metadata?.shippingAddressId");
  });

  it("B: create-order receives shippingAddressId and writes orders.shipping_address_id", () => {
    const createOrder = read("lib/orders/create-order-from-checkout-session.server.ts");
    expect(createOrder).toContain("shippingAddressId?: string | null");
    expect(createOrder).toContain("shipping_address_id: input.shippingAddressId ?? null");
    expect(createOrder).toContain("selected_shipping_quote_id: selectedShippingQuoteId");
    expect(createOrder).not.toContain("collection_address");
    expect(createOrder).not.toContain("delivery_address");
  });

  it("C/D: post-payment persists collection_address and delivery_address snapshots", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false });

    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord-future-1",
        selectedQuoteId: SELECTED_QUOTE_ID,
        carrier: "Royal Mail",
        collectionAddress: expect.objectContaining({
          role: "collection",
          postcode: "SW1A 1AA",
          country: "GB",
        }),
        deliveryAddress: expect.objectContaining({
          role: "delivery",
          postcode: "SW1A 1AA",
          country: "GB",
        }),
      }),
    );
    expect(shippingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection_address: expect.objectContaining({ role: "collection" }),
        delivery_address: expect.objectContaining({ role: "delivery" }),
        selected_quote_id: SELECTED_QUOTE_ID,
      }),
    );
  });

  it("E/F/G/H: selected quote id, quote row, parcel tier, and shipping price stay unchanged", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    const result = await ensureOrderShippingPersistence(baseOrder, {
      allowLiveQuoteEnrichment: false,
    });

    expect(result.selectedQuoteId).toBe(SELECTED_QUOTE_ID);
    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedQuoteId: SELECTED_QUOTE_ID,
        manualTier: "small_parcel",
        carrier: "Royal Mail",
      }),
    );
    expect(saveShippingQuotes).not.toHaveBeenCalled();
    expect(baseOrder.delivery_fee).toBe(2.38);
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("resolveSellerCollectionAddress");
    expect(postPayment).toContain("retainCheckoutSelectedQuoteId");
    expect(postPayment).not.toContain("quotes[0]");
  });

  it("I: already-V3 selected quote is not downgraded", () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("Never downgrade a V3-enriched selected quote");
    expect(postPayment).toContain("existingHasConfirmedV3");
    expect(postPayment).toContain("applySelectedShippingQuotePayload");
    expect(postPayment).not.toContain("shippingOptionCode: `sendcloud:");
  });

  it("J: V2-only Sendcloud quote still uses generic V3 discovery", () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(postPayment).toContain("selectedSendcloudQuoteNeedsV3Discovery");
    expect(postPayment).toContain("updateShippingQuotePayloadWithoutReplacing");
    expect(postPayment).not.toContain("shippingOptionCode: \"royal_mail");
    expect(postPayment).not.toContain("shippingOptionCode: \"hermes");
  });

  it("K/L: Royal Mail and Evri stay on the same generic path", () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    const labelGen = read("lib/shipping/label-generation.server.ts");
    expect(postPayment).not.toContain('if (carrier === "Royal Mail")');
    expect(postPayment).not.toContain('if (carrier === "Evri")');
    expect(labelGen).not.toContain('if (carrier === "Royal Mail")');
    expect(labelGen).not.toContain('if (carrier === "Evri")');
    expect(postPayment).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(labelGen).toContain("discoverConfirmedV3MetadataForV2Method");
  });

  it("M/N: no quotes[0] fallback and no hardcoded V3 codes", () => {
    const store = read("lib/shipping/store.ts");
    const postPayment = read("lib/orders/post-payment.server.ts");
    const checkout = read("lib/orders/checkout.ts");
    expect(store).not.toContain("quotes[0]");
    expect(postPayment).not.toContain("quotes[0]");
    expect(checkout).not.toContain("quotes[0]");
    expect(postPayment).toContain("SHIPPING_ADDRESS_SNAPSHOTS_REQUIRED");
    expect(store).toContain("collection_address: input.collectionAddress");
    expect(store).toContain("delivery_address: input.deliveryAddress");
  });

  it("O: seller cancel / wallet / refund / messages / notifications / LCP files are not this path", () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    const store = read("lib/shipping/store.ts");
    const quotes = read("lib/checkout/shipping-quotes.server.ts");
    for (const source of [postPayment, store, quotes]) {
      expect(source).not.toContain("cancelSellerOrder");
      expect(source).not.toContain("cancelBuyerOrder");
      expect(source).not.toContain("SafeImage");
    }
  });

  it("Sendcloud persistence fails closed when address snapshots cannot be resolved", async () => {
    createAdminFrom.mockImplementation((table: string) => {
      if (table === "profiles") return adminChain({ full_name: "Seller" });
      if (table === "shipping_addresses") return adminChain(null);
      if (table === "products") return adminChain({ parcel_size: "small" });
      return adminChain(null);
    });

    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await expect(
      ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false }),
    ).rejects.toThrow(/SHIPPING_ADDRESS_SNAPSHOTS_REQUIRED/);
    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedQuoteId: SELECTED_QUOTE_ID,
        collectionAddress: null,
        deliveryAddress: null,
      }),
    );
  });
});
