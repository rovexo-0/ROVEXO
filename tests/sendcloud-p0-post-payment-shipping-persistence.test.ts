/**
 * SENDCLOUD_P0_POST_PAYMENT_SHIPPING_PERSISTENCE_FIX — focused tests A–H.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const ensureShippingRecord = vi.fn();
const getShippingRecord = vi.fn();
const saveShippingQuotes = vi.fn();
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
  isSendcloudConfigured: () => false,
}));

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

describe("SENDCLOUD_P0 post-payment shipping persistence", () => {
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
          recipient_name: "Buyer",
          address_line: "10 Downing Street",
          address_line_2: null,
          city: "London",
          postcode: "SW1A 2AA",
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

    ensureShippingRecord.mockResolvedValue({
      id: "sr-1",
      orderId: "ord-1",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: null,
      pricing: null,
    });
    getShippingRecord.mockResolvedValue({
      id: "sr-1",
      orderId: "ord-1",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: "Royal Mail",
      pricing: {
        quotes: [
          {
            id: "sendcloud:42",
            providerId: "sendcloud",
            carrier: "Royal Mail",
            serviceName: "Royal Mail",
            pricePence: 238,
            currency: "GBP",
            estimatedDays: { min: 1, max: 5 },
          },
        ],
        selectedQuoteId: "sendcloud:42",
        currency: "GBP",
        providerAvailable: true,
      },
    });
    saveShippingQuotes.mockImplementation(async ({ pricing }) => ({
      id: "sr-1",
      orderId: "ord-1",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: "Royal Mail",
      pricing,
    }));
    listShipmentParcelsForOrder.mockResolvedValue([]);
    createShipmentParcel.mockResolvedValue({ id: "parcel-1" });
    fetchShippingQuotesServer.mockResolvedValue({
      quotes: [],
      selectedQuoteId: null,
      currency: "GBP",
      providerAvailable: true,
    });
  });

  it("A: selected Sendcloud method persistence uses exact sendcloud:<methodId>", async () => {
    const checkout = readFileSync("lib/orders/checkout.ts", "utf8");
    expect(checkout).toContain("selected_shipping_quote_id: selectedShippingQuoteId");
    expect(checkout).toContain("shippingQuoteId: selectedShippingQuoteId");
    expect(checkout).toContain("selectedShippingQuoteId");

    const createOrder = readFileSync(
      "lib/orders/create-order-from-checkout-session.server.ts",
      "utf8",
    );
    expect(createOrder).toContain("selected_shipping_quote_id: selectedShippingQuoteId");
    expect(createOrder).toContain("shipping_setup_status: \"pending\"");
  });

  it("B: paid order persistence creates exactly one shipping_record path", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );

    getShippingRecord
      .mockResolvedValueOnce({
        id: "sr-1",
        orderId: "ord-1",
        parcelTier: "small_parcel",
        status: "preparing",
        carrier: null,
        pricing: null,
      })
      .mockResolvedValue({
        id: "sr-1",
        orderId: "ord-1",
        parcelTier: "small_parcel",
        status: "preparing",
        carrier: "Royal Mail",
        pricing: {
          quotes: [
            {
              id: "sendcloud:42",
              providerId: "sendcloud",
              carrier: "Royal Mail",
              serviceName: "Royal Mail",
              pricePence: 238,
              currency: "GBP",
              estimatedDays: { min: 1, max: 5 },
            },
          ],
          selectedQuoteId: "sendcloud:42",
          currency: "GBP",
          providerAvailable: true,
        },
      });

    const result = await ensureOrderShippingPersistence(
      {
        id: "ord-1",
        order_number: "RVXTEST",
        status: "awaiting_shipment",
        buyer_id: "b1",
        seller_id: "s1",
        item_price: 10,
        delivery_fee: 2.38,
        delivery_carrier: "Royal Mail",
        shipping_address_id: "addr-1",
        selected_shipping_quote_id: "sendcloud:42",
        order_items: [
          {
            product_id: "p1",
            title: "Item",
            image_url: "/x.png",
            quantity: 1,
            slug: "item",
          },
        ],
      },
      { allowLiveQuoteEnrichment: false },
    );

    expect(ensureShippingRecord).toHaveBeenCalledTimes(1);
    expect(ensureShippingRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord-1",
        selectedQuoteId: "sendcloud:42",
        carrier: "Royal Mail",
      }),
    );
    expect(result.selectedQuoteId).toBe("sendcloud:42");
    expect(createShipmentParcel).toHaveBeenCalledTimes(1);
  });

  it("C: repeated persistence remains idempotent (existing record reused)", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );

    listShipmentParcelsForOrder.mockResolvedValue([{ id: "parcel-1" }]);
    ensureShippingRecord.mockResolvedValue({
      id: "sr-1",
      orderId: "ord-1",
      parcelTier: "small_parcel",
      status: "preparing",
      carrier: "Royal Mail",
      pricing: {
        quotes: [
          {
            id: "sendcloud:42",
            providerId: "sendcloud",
            carrier: "Royal Mail",
            serviceName: "Royal Mail",
            pricePence: 238,
            currency: "GBP",
            estimatedDays: { min: 1, max: 5 },
          },
        ],
        selectedQuoteId: "sendcloud:42",
        currency: "GBP",
        providerAvailable: true,
      },
    });

    await ensureOrderShippingPersistence(
      {
        id: "ord-1",
        order_number: "RVXTEST",
        status: "awaiting_shipment",
        buyer_id: "b1",
        seller_id: "s1",
        item_price: 10,
        delivery_fee: 2.38,
        delivery_carrier: "Royal Mail",
        shipping_address_id: "addr-1",
        selected_shipping_quote_id: "sendcloud:42",
        order_items: [
          {
            product_id: "p1",
            title: "Item",
            image_url: "/x.png",
            quantity: 1,
            slug: "item",
          },
        ],
      },
      { allowLiveQuoteEnrichment: false },
    );

    expect(createShipmentParcel).not.toHaveBeenCalled();
    expect(ensureShippingRecord).toHaveBeenCalledTimes(1);
  });

  it("D: shipping_record insert failure is observable (structured log contract)", () => {
    const store = readFileSync("lib/shipping/store.ts", "utf8");
    expect(store).toContain("[shipping] ensureShippingRecord insert failed");
    expect(store).toContain("failureStage: \"shipping_records.insert\"");
    expect(store).toContain("orderId: input.orderId");
    expect(store).toContain("/duplicate key|unique/i");
  });

  it("E: paid order with shipping persistence failure enters repair_required", () => {
    const source = readFileSync("lib/orders/post-payment.server.ts", "utf8");
    expect(source).toContain('markOrderShippingSetupStatus(input.orderId, "repair_required")');
    expect(source).toContain("[orders/post-payment] shipping persistence failed");
    expect(source).toContain("shippingSetupStatus");
  });

  it("F: repair path is idempotent and exported", () => {
    const repair = readFileSync("lib/orders/repair-paid-order-shipping.server.ts", "utf8");
    expect(repair).toContain("export async function repairPaidOrderShippingPersistence");
    expect(repair).toContain("export async function needsPaidOrderShippingRepair");
    expect(repair).toContain("allowLiveQuoteEnrichment: false");
    expect(repair).toContain("sendcloudCalled: false");
    expect(repair).toContain("idempotent");
  });

  it("G: label endpoint still resolves quote from shipping record selectedQuoteId", () => {
    const labels = readFileSync("lib/shipping/label-generation.server.ts", "utf8");
    expect(labels).toContain("record?.pricing?.selectedQuoteId");
    expect(labels).toContain("No shipping quote available for this order.");
  });

  it("H: repair / durable persistence does not call Sendcloud parcel create", async () => {
    const { ensureOrderShippingPersistence } = await import(
      "@/lib/orders/post-payment.server"
    );

    await ensureOrderShippingPersistence(
      {
        id: "ord-1",
        order_number: "RVXTEST",
        status: "awaiting_shipment",
        buyer_id: "b1",
        seller_id: "s1",
        item_price: 10,
        delivery_fee: 2.38,
        delivery_carrier: "Royal Mail",
        shipping_address_id: "addr-1",
        selected_shipping_quote_id: "sendcloud:42",
        order_items: [
          {
            product_id: "p1",
            title: "Item",
            image_url: "/x.png",
            quantity: 1,
            slug: "item",
          },
        ],
      },
      { allowLiveQuoteEnrichment: false },
    );

    expect(fetchShippingQuotesServer).not.toHaveBeenCalled();
    const repair = readFileSync("lib/orders/repair-paid-order-shipping.server.ts", "utf8");
    expect(repair).not.toContain("generateShippingLabelForOrder");
    expect(repair).not.toContain("SendcloudService");
  });

  it("migration adds selected quote + shipping_setup_status without new tables", () => {
    const migration = readFileSync(
      "supabase/migrations/20260811140000_post_payment_shipping_persistence_v1.sql",
      "utf8",
    );
    expect(migration).toContain("selected_shipping_quote_id");
    expect(migration).toContain("shipping_setup_status");
    expect(migration).toContain("repair_required");
    expect(migration).not.toContain("CREATE TABLE");
  });
});
