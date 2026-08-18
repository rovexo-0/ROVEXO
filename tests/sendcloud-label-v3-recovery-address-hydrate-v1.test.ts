/**
 * Label-time V3 recovery: hydrate NULL shipping-record address snapshots
 * from existing resolvers, persist fill-if-null, discover V3 onto the SAME quote.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const getShippingRecord = vi.fn();
const ensureShippingRecord = vi.fn();
const saveShippingQuotes = vi.fn();
const updateShippingQuotePayloadWithoutReplacing = vi.fn();
const appendAndSelectShippingQuoteWithoutReplacing = vi.fn();
const resolveSellerCollectionAddress = vi.fn();
const discoverConfirmedV3MetadataForV2Method = vi.fn();
const buildLiveCheckoutSendcloudV3Route = vi.fn((input: unknown) => input);
const generateOrderShippingLabel = vi.fn();
const getSellerShippingSettings = vi.fn();
const listShipmentParcelsForOrder = vi.fn();
const getShipmentParcelById = vi.fn();
const createShipmentParcel = vi.fn();
const updateShipmentParcel = vi.fn();
const getProviderParcelIdForShipmentParcel = vi.fn();
const createAdminFrom = vi.fn();

vi.mock("@/lib/shipping/store", () => ({
  getShippingRecord: (...args: unknown[]) => getShippingRecord(...args),
  ensureShippingRecord: (...args: unknown[]) => ensureShippingRecord(...args),
  saveShippingQuotes: (...args: unknown[]) => saveShippingQuotes(...args),
  updateShippingQuotePayloadWithoutReplacing: (...args: unknown[]) =>
    updateShippingQuotePayloadWithoutReplacing(...args),
  appendAndSelectShippingQuoteWithoutReplacing: (...args: unknown[]) =>
    appendAndSelectShippingQuoteWithoutReplacing(...args),
}));

vi.mock("@/lib/checkout/shipping-quotes.server", () => ({
  resolveSellerCollectionAddress: (...args: unknown[]) =>
    resolveSellerCollectionAddress(...args),
}));

vi.mock("@/lib/shipping/sendcloud/v3-catalog-v1", () => ({
  discoverConfirmedV3MetadataForV2Method: (...args: unknown[]) =>
    discoverConfirmedV3MetadataForV2Method(...args),
  buildLiveCheckoutSendcloudV3Route: (...args: unknown[]) =>
    buildLiveCheckoutSendcloudV3Route(...args),
}));

vi.mock("@/lib/shipping/server", () => ({
  generateOrderShippingLabel: (...args: unknown[]) => generateOrderShippingLabel(...args),
}));

vi.mock("@/lib/seller/shipping-settings", () => ({
  getSellerShippingSettings: (...args: unknown[]) => getSellerShippingSettings(...args),
}));

vi.mock("@/lib/shipping/parcels-repository", () => ({
  listShipmentParcelsForOrder: (...args: unknown[]) => listShipmentParcelsForOrder(...args),
  getShipmentParcelById: (...args: unknown[]) => getShipmentParcelById(...args),
  createShipmentParcel: (...args: unknown[]) => createShipmentParcel(...args),
  updateShipmentParcel: (...args: unknown[]) => updateShipmentParcel(...args),
  getProviderParcelIdForShipmentParcel: (...args: unknown[]) =>
    getProviderParcelIdForShipmentParcel(...args),
}));

vi.mock("@/lib/full-demo/security", () => ({
  mustUseDemoShipping: () => false,
  mustUseDemoShippingForActors: () => false,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => createAdminFrom(...args),
  }),
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
      if (prop === "in") {
        return async () => ({ data: Array.isArray(data) ? data : [], error: null });
      }
      if (!(prop in target)) target[prop as string] = vi.fn(() => self);
      return target[prop as string];
    },
  });
  return self;
}

const ORDER_ID = "72121d8c-f44a-4776-a1f8-e0f9121075c1";
const SELLER_ID = "seller-1";
const QUOTE_ID = "sendcloud:29631";
const V3_CODE = "royal_mailv2:tracked_24/size=s";

const collectionSnapshot = {
  role: "collection" as const,
  fullName: "Seller",
  line1: "1 Seller Street",
  city: "London",
  postcode: "E1 6AN",
  country: "GB",
  validated: false,
};

const deliveryRow = {
  recipient_name: "Buyer",
  address_line: "10 Example Street",
  address_line_2: null,
  city: "London",
  postcode: "SW1A 1AA",
  country: "GB",
};

const v2Quote = {
  id: QUOTE_ID,
  quoteRowId: "0936d54c-171e-4eb7-8014-6ddadb02d9a8",
  providerId: "sendcloud",
  carrier: "Royal Mail",
  serviceName: "Royal Mail",
  pricePence: 238,
  currency: "GBP",
  estimatedDays: { min: 1, max: 5 },
  v2MethodId: 29631,
};

const parcel = {
  id: "parcel-1",
  shippingRecordId: "sr-1",
  parcelNumber: 1,
  totalParcels: 1,
  weightKg: 2,
  dimensions: { lengthCm: 45, widthCm: 35, heightCm: 16 },
  carrier: null,
  shippingService: null,
  trackingNumber: null,
  trackingUrl: null,
  status: "preparing",
  productItemIds: [],
  insuranceEnabled: false,
  insuranceValueGbp: null,
  operation: null,
  estimatedDeliveryAt: null,
  label: null,
  createdAt: "2026-08-18T00:00:00.000Z",
  updatedAt: "2026-08-18T00:00:00.000Z",
};

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: "sr-1",
    orderId: ORDER_ID,
    parcelTier: "small_parcel",
    status: "preparing",
    carrier: "Royal Mail",
    collectionAddress: null,
    deliveryAddress: null,
    pricing: {
      quotes: [v2Quote],
      selectedQuoteId: QUOTE_ID,
      currency: "GBP",
      providerAvailable: true,
    },
    parcels: [parcel],
    ...overrides,
  };
}

describe("label V3 recovery address hydrate v1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    createAdminFrom.mockImplementation((table: string) => {
      if (table === "orders") {
        return adminChain({
          id: ORDER_ID,
          order_number: "RVXLABEL",
          seller_id: SELLER_ID,
          buyer_id: "buyer-1",
          shipping_address_id: "addr-delivery-1",
          status: "awaiting_shipment",
          selected_shipping_quote_id: QUOTE_ID,
          delivery_carrier: "Royal Mail",
          delivery_fee: 2.38,
        });
      }
      if (table === "profiles") {
        return adminChain([
          { id: SELLER_ID, email: "seller@example.com", phone: "", full_name: "Seller" },
          { id: "buyer-1", email: "buyer@example.com", phone: "", full_name: "Buyer" },
        ]);
      }
      if (table === "shipping_addresses") return adminChain(deliveryRow);
      return adminChain(null);
    });

    resolveSellerCollectionAddress.mockResolvedValue(collectionSnapshot);
    getShippingRecord.mockResolvedValue(record());
    ensureShippingRecord.mockImplementation(async (input: { collectionAddress?: unknown; deliveryAddress?: unknown }) =>
      record({
        collectionAddress: input.collectionAddress ?? collectionSnapshot,
        deliveryAddress: input.deliveryAddress ?? {
          role: "delivery",
          postcode: "SW1A 1AA",
          country: "GB",
        },
      }),
    );
    discoverConfirmedV3MetadataForV2Method.mockResolvedValue({
      shippingOptionCode: V3_CODE,
      contractId: "c1",
    });
    updateShippingQuotePayloadWithoutReplacing.mockImplementation(async ({ quote }: { quote: { id: string } }) =>
      record({
        collectionAddress: collectionSnapshot,
        deliveryAddress: { role: "delivery", postcode: "SW1A 1AA", country: "GB" },
        pricing: {
          quotes: [{ ...v2Quote, ...quote, shippingOptionCode: V3_CODE, contractId: "c1" }],
          selectedQuoteId: QUOTE_ID,
          currency: "GBP",
          providerAvailable: true,
        },
      }),
    );
    listShipmentParcelsForOrder.mockResolvedValue([parcel]);
    getShipmentParcelById.mockResolvedValue({
      ...parcel,
      trackingNumber: "TRACK1",
      label: { status: "ready", pdfUrl: "https://example.test/label.pdf" },
    });
    getProviderParcelIdForShipmentParcel.mockResolvedValue(99);
    getSellerShippingSettings.mockResolvedValue({ defaultLabelSize: "a6" });
    generateOrderShippingLabel.mockResolvedValue({
      record: record({
        collectionAddress: collectionSnapshot,
        pricing: {
          quotes: [{ ...v2Quote, shippingOptionCode: V3_CODE }],
          selectedQuoteId: QUOTE_ID,
        },
      }),
      providerFailure: null,
    });
  });

  it("1-7: NULL snapshots hydrate → discover V3 → persist SAME quote → gate passes → announce reachable", async () => {
    const { generateShippingLabelForOrder } = await import(
      "@/lib/shipping/label-generation.server"
    );
    const result = await generateShippingLabelForOrder(ORDER_ID, SELLER_ID);

    expect(resolveSellerCollectionAddress).toHaveBeenCalledWith(SELLER_ID, "Seller");
    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        collectionAddress: expect.objectContaining({ role: "collection", postcode: "E1 6AN" }),
        deliveryAddress: expect.objectContaining({ role: "delivery", postcode: "SW1A 1AA" }),
      }),
    );
    expect(discoverConfirmedV3MetadataForV2Method).toHaveBeenCalledWith(
      expect.objectContaining({ v2MethodId: 29631 }),
    );
    expect(updateShippingQuotePayloadWithoutReplacing).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        quote: expect.objectContaining({
          id: QUOTE_ID,
          shippingOptionCode: V3_CODE,
        }),
      }),
    );
    expect(generateOrderShippingLabel).toHaveBeenCalledWith(
      ORDER_ID,
      expect.objectContaining({
        quoteId: QUOTE_ID,
        shippingOptionCode: V3_CODE,
        v2MethodId: 29631,
      }),
    );
    expect(result.ok).toBe(true);
    expect(saveShippingQuotes).not.toHaveBeenCalled();
  });

  it("8: genuine no-counterpart still fail-closed; announce not reached", async () => {
    discoverConfirmedV3MetadataForV2Method.mockResolvedValue(null);

    const { generateShippingLabelForOrder } = await import(
      "@/lib/shipping/label-generation.server"
    );
    const result = await generateShippingLabelForOrder(ORDER_ID, SELLER_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/shipping_option_code is required/);
    }
    expect(generateOrderShippingLabel).not.toHaveBeenCalled();
    expect(updateShippingQuotePayloadWithoutReplacing).not.toHaveBeenCalled();
  });

  it("null resolvers do not fabricate addresses or invent V3 codes", async () => {
    resolveSellerCollectionAddress.mockResolvedValue(null);
    createAdminFrom.mockImplementation((table: string) => {
      if (table === "orders") {
        return adminChain({
          id: ORDER_ID,
          order_number: "RVXLABEL",
          seller_id: SELLER_ID,
          buyer_id: "buyer-1",
          shipping_address_id: "addr-delivery-1",
          status: "awaiting_shipment",
          selected_shipping_quote_id: QUOTE_ID,
          delivery_carrier: "Royal Mail",
          delivery_fee: 2.38,
        });
      }
      if (table === "profiles") {
        return adminChain([{ id: SELLER_ID, email: "s@x.com", phone: "", full_name: "Seller" }]);
      }
      if (table === "shipping_addresses") return adminChain(null);
      return adminChain(null);
    });

    const { generateShippingLabelForOrder } = await import(
      "@/lib/shipping/label-generation.server"
    );
    const result = await generateShippingLabelForOrder(ORDER_ID, SELLER_ID);

    expect(result.ok).toBe(false);
    expect(discoverConfirmedV3MetadataForV2Method).not.toHaveBeenCalled();
    expect(generateOrderShippingLabel).not.toHaveBeenCalled();
    const persistArg = ensureShippingRecord.mock.calls[0]?.[0] as
      | { collectionAddress: unknown; deliveryAddress: unknown }
      | undefined;
    if (persistArg) {
      expect(persistArg.collectionAddress).toBeNull();
      expect(persistArg.deliveryAddress).toBeNull();
    }
  });

  it("9-12: no hardcoded V3, no quotes[0], Royal Mail and Evri stay generic", () => {
    const labelGen = read("lib/shipping/label-generation.server.ts");
    const recover = labelGen.slice(
      labelGen.indexOf("Paid-before-snapshot records"),
      labelGen.indexOf("Sendcloud production: fail closed when V3 shipping_option_code"),
    );
    expect(recover).toContain("resolveSellerCollectionAddress(order.seller_id");
    expect(recover).toContain("resolveOrderDeliveryAddress(order.shipping_address_id)");
    expect(recover).toContain("discoverConfirmedV3MetadataForV2Method");
    expect(recover).toContain("updateShippingQuotePayloadWithoutReplacing");
    expect(recover).not.toContain("quotes[0]");
    expect(labelGen).not.toContain('if (carrier === "Royal Mail")');
    expect(labelGen).not.toContain('if (carrier === "Evri")');
    expect(recover).not.toContain('shippingOptionCode: "royal_mail');
    expect(recover).not.toContain('shippingOptionCode: "hermes');
    expect(labelGen).not.toContain("cancelSellerOrder");
    expect(labelGen).not.toContain("SafeImage");
  });
});
