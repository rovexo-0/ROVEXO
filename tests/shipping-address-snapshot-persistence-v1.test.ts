/**
 * Address snapshot persistence: existing resolvers → ensureShippingRecord.
 * Does not change quote identity, parcel_tier, prices, V3 mapping, or cancel/wallet/refund paths.
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
const resolveSellerCollectionAddress = vi.fn();
const shippingAddressEq = vi.fn();

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

vi.mock("@/lib/checkout/shipping-quotes.server", () => ({
  resolveSellerCollectionAddress: (...args: unknown[]) =>
    resolveSellerCollectionAddress(...args),
}));

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function adminChain(data: unknown = null, eqSpy?: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get(target, prop) {
      if (prop === "then") return undefined;
      if (prop === "maybeSingle" || prop === "single") {
        return async () => ({ data, error: null });
      }
      if (prop === "eq") {
        return (...args: unknown[]) => {
          eqSpy?.(...args);
          return self;
        };
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
const DELIVERY_ADDRESS_ID = "addr-delivery-1";
const SELLER_ID = "s1";

const validCollection = {
  role: "collection" as const,
  fullName: "Seller",
  line1: "1 Seller Street",
  city: "London",
  postcode: "E1 6AN",
  country: "GB",
  validated: false,
};

const validDeliveryRow = {
  recipient_name: "Recipient",
  address_line: "10 Example Street",
  address_line_2: null,
  city: "London",
  postcode: "SW1A 1AA",
  country: "GB",
};

const baseOrder = {
  id: "ord-future-1",
  order_number: "RVXADDR",
  status: "awaiting_shipment",
  buyer_id: "b1",
  seller_id: SELLER_ID,
  item_price: 10,
  delivery_fee: 2.38,
  delivery_carrier: "Royal Mail",
  shipping_address_id: DELIVERY_ADDRESS_ID,
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

function mockAdmin(deliveryRow: unknown) {
  createAdminFrom.mockImplementation((table: string) => {
    if (table === "profiles") return adminChain({ full_name: "Seller" });
    if (table === "shipping_addresses") {
      return adminChain(deliveryRow, shippingAddressEq);
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
}

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

    resolveSellerCollectionAddress.mockResolvedValue(validCollection);
    mockAdmin(validDeliveryRow);

    const record = {
      id: "sr-1",
      orderId: "ord-future-1",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: "Royal Mail",
      collectionAddress: validCollection,
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

  it("A: valid collection + delivery snapshots are passed to ensureShippingRecord", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false });

    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord-future-1",
        collectionAddress: expect.objectContaining({
          role: "collection",
          line1: "1 Seller Street",
          postcode: "E1 6AN",
          country: "GB",
        }),
        deliveryAddress: expect.objectContaining({
          role: "delivery",
          line1: "10 Example Street",
          postcode: "SW1A 1AA",
          country: "GB",
        }),
      }),
    );
    expect(shippingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection_address: expect.objectContaining({ role: "collection", postcode: "E1 6AN" }),
        delivery_address: expect.objectContaining({ role: "delivery", postcode: "SW1A 1AA" }),
      }),
    );
  });

  it("B: delivery resolution uses orders.shipping_address_id", async () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("resolveDeliveryAddress(order.shipping_address_id)");
    expect(postPayment).toContain('.eq("id", shippingAddressId)');

    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false });

    expect(shippingAddressEq).toHaveBeenCalledWith("id", DELIVERY_ADDRESS_ID);
  });

  it("C: collection resolution uses seller_id", async () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("resolveSellerCollectionAddress(");
    expect(postPayment).toContain("order.seller_id");

    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false });

    expect(resolveSellerCollectionAddress).toHaveBeenCalledWith(SELLER_ID, "Seller");
  });

  it("D: selected quote identity remains unchanged", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    const result = await ensureOrderShippingPersistence(baseOrder, {
      allowLiveQuoteEnrichment: false,
    });

    expect(result.selectedQuoteId).toBe(SELECTED_QUOTE_ID);
    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({ selectedQuoteId: SELECTED_QUOTE_ID }),
    );
    expect(shippingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ selected_quote_id: SELECTED_QUOTE_ID }),
    );
    expect(saveShippingQuotes).not.toHaveBeenCalled();
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).toContain("retainCheckoutSelectedQuoteId");
    expect(postPayment).not.toContain("quotes[0]");
  });

  it("E: parcel_tier remains unchanged", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false });

    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        manualTier: "small_parcel",
        selectedQuoteId: SELECTED_QUOTE_ID,
        carrier: "Royal Mail",
      }),
    );
    expect(baseOrder.delivery_fee).toBe(2.38);
  });

  it("F: null collection snapshot does not fabricate data", async () => {
    resolveSellerCollectionAddress.mockResolvedValue(null);

    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await expect(
      ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false }),
    ).rejects.toThrow(/SHIPPING_ADDRESS_SNAPSHOTS_REQUIRED/);

    const input = ensureShippingRecord.mock.calls[0]?.[0] as {
      collectionAddress: unknown;
      deliveryAddress: { role: string };
    };
    expect(input.collectionAddress).toBeNull();
    expect(input.deliveryAddress).toEqual(
      expect.objectContaining({ role: "delivery", postcode: "SW1A 1AA" }),
    );
    expect(JSON.stringify(input.collectionAddress)).not.toContain("Demo Seller");
    expect(JSON.stringify(input)).not.toContain("1 Demo Street");
  });

  it("G: null delivery snapshot does not fabricate data", async () => {
    mockAdmin(null);

    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await expect(
      ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false }),
    ).rejects.toThrow(/SHIPPING_ADDRESS_SNAPSHOTS_REQUIRED/);

    const input = ensureShippingRecord.mock.calls[0]?.[0] as {
      collectionAddress: { role: string };
      deliveryAddress: unknown;
    };
    expect(input.deliveryAddress).toBeNull();
    expect(input.collectionAddress).toEqual(
      expect.objectContaining({ role: "collection", postcode: "E1 6AN" }),
    );
    expect(JSON.stringify(input.deliveryAddress)).not.toContain("Demo Buyer");
    expect(JSON.stringify(input)).not.toContain("2 Demo Road");
  });

  it("H: no changes to wallet/refund/cancel/messages/notifications", () => {
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).not.toContain("cancelSellerOrder");
    expect(postPayment).not.toContain("cancelBuyerOrder");
    expect(postPayment).not.toContain("refundOrder");
    expect(postPayment).not.toContain("SafeImage");
  });

  it("I: no Sendcloud call is introduced by this fix", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );
    await ensureOrderShippingPersistence(baseOrder, { allowLiveQuoteEnrichment: false });

    expect(fetchShippingQuotesServer).not.toHaveBeenCalled();
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(postPayment).not.toContain("createSendcloud");
  });

  it("J: existing shipping-record persistence behaviour remains compatible", () => {
    const store = read("lib/shipping/store.ts");
    const postPayment = read("lib/orders/post-payment.server.ts");
    expect(store).toContain("collection_address: input.collectionAddress");
    expect(store).toContain("delivery_address: input.deliveryAddress");
    expect(postPayment).toContain("ensureShippingRecord({");
    expect(postPayment).toContain("collectionAddress: collectionSnapshot");
    expect(postPayment).toContain("deliveryAddress: deliverySnapshot");
    expect(postPayment).toContain("SHIPPING_ADDRESS_SNAPSHOTS_REQUIRED");
    expect(store).not.toContain("quotes[0]");
  });
});
