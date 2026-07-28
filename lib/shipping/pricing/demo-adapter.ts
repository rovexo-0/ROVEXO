/**
 * Demo shipping adapter — fake quotes, labels, and tracking.
 * Used when SENDCLOUD_SANDBOX / certification mode is active.
 * Never calls the real Sendcloud HTTP API.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import {
  FULL_DEMO_PARCEL_SPECS,
  generateDemoDeliveryDate,
  generateDemoTrackingNumber,
} from "@/lib/full-demo/canonical";
import type {
  ShippingLabelRequest,
  ShippingLabelResponse,
  ShippingProvider,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
} from "@/lib/shipping/pricing/provider";
import type { ShippingQuote } from "@/lib/shipping/types";

/** Legacy string IDs (pre-UUID). Kept for isDemoShippingQuoteId compatibility. */
export const DEMO_SHIPPING_QUOTE_PREFIX = "demo:";

/**
 * Demo quote IDs must be unique per quote fetch.
 * `shipping_quotes.id` is a global UUID PK — reusing stable IDs across orders
 * causes duplicate-key failures during concurrent Full Demo checkouts.
 */
export function isDemoShippingQuoteId(quoteId: string): boolean {
  return quoteId.startsWith(DEMO_SHIPPING_QUOTE_PREFIX);
}

/** Full Demo / certification tracking numbers — never real carrier labels. */
export function isDemoShippingTrackingNumber(tracking: string | null | undefined): boolean {
  return Boolean(tracking && /^RVXDEMO[A-Z0-9]+$/i.test(tracking.trim()));
}

/**
 * Live demo label presentation URL (relative).
 * Always resolve at view time — never serve a stored HTML snapshot as the document.
 */
export function buildDemoShippingLabelPresentationUrl(input: {
  tracking: string;
  carrier?: string | null;
  service?: string | null;
}): string {
  const qs = new URLSearchParams({
    tracking: input.tracking.trim().toUpperCase(),
    carrier: (input.carrier ?? "Royal Mail").trim() || "Royal Mail",
    service: (input.service ?? "Tracked 48").trim().replace(/^Demo\s+/i, "") || "Tracked 48",
  });
  return `/api/shipping/demo-label?${qs.toString()}`;
}

function buildDemoQuotes(): ShippingQuote[] {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return [
    {
      id: randomUUID(),
      providerId: "sendcloud",
      carrier: "Royal Mail",
      serviceName: "Demo Tracked 24",
      pricePence: 399,
      currency: "GBP",
      estimatedDays: { min: 1, max: 2 },
      recommended: "fastest",
      expiresAt,
    },
    {
      id: randomUUID(),
      providerId: "sendcloud",
      carrier: "Royal Mail",
      serviceName: "Demo Tracked 48",
      pricePence: 299,
      currency: "GBP",
      estimatedDays: { min: 2, max: 3 },
      recommended: "cheapest",
      expiresAt,
    },
    {
      id: randomUUID(),
      providerId: "sendcloud",
      carrier: "Evri",
      serviceName: "Demo Standard",
      pricePence: 349,
      currency: "GBP",
      estimatedDays: { min: 2, max: 4 },
      expiresAt,
    },
  ];
}

/**
 * In-app demo shipping provider.
 * Implements the same ShippingProvider contract as SendcloudAdapter.
 */
export class DemoShippingAdapter implements ShippingProvider {
  readonly id = "sendcloud";
  readonly name = "ROVEXO Demo Shipping";

  isConfigured(): boolean {
    // Always available — router / label engine decide when to select demo vs Sendcloud.
    return true;
  }

  async getQuotes(_request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
    void _request;
    if (!this.isConfigured()) {
      return { available: false, quotes: [], reason: "provider_not_configured" };
    }
    return { available: true, quotes: buildDemoQuotes() };
  }

  async createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse> {
    if (!this.isConfigured()) {
      return {
        available: false,
        trackingNumber: null,
        barcode: null,
        qrPayload: null,
        pdfUrl: null,
        carrier: null,
        reason: "provider_not_configured",
      };
    }

    // Quote IDs are unique per fetch; match by id when possible, else first demo quote.
    const quotes = buildDemoQuotes();
    const quote = quotes.find((entry) => entry.id === request.quoteId) ?? quotes[0];

    if (!quote) {
      return {
        available: false,
        trackingNumber: null,
        barcode: null,
        qrPayload: null,
        pdfUrl: null,
        carrier: null,
        reason: "quote_expired",
      };
    }

    const parcelNumber = request.parcelNumber ?? 1;
    const seed = `${request.orderNumber}-${parcelNumber}`;
    const trackingNumber = generateDemoTrackingNumber(seed);
    const serviceName = quote.serviceName.replace(/^Demo\s+/i, "");

    return {
      available: true,
      trackingNumber,
      barcode: trackingNumber,
      qrPayload: trackingNumber,
      pdfUrl: buildDemoShippingLabelPresentationUrl({
        tracking: trackingNumber,
        carrier: quote.carrier,
        service: serviceName,
      }),
      carrier: quote.carrier,
      sendcloudParcelId: null,
      serviceCode: quote.serviceName,
    };
  }
}

export const demoShippingAdapter = new DemoShippingAdapter();

export function listFullDemoParcelLabels(): readonly string[] {
  return FULL_DEMO_PARCEL_SPECS.map((spec) => spec.label);
}

export function resolveDemoParcelEstimatedDelivery(parcelNumber: number): string {
  return generateDemoDeliveryDate(2 + parcelNumber);
}
