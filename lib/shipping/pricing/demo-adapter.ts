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
import { mustUseDemoShipping } from "@/lib/full-demo/security";
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
    return mustUseDemoShipping();
  }

  async getQuotes(_request: ShippingQuoteRequest): Promise<ShippingQuoteResponse> {
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
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

    return {
      available: true,
      trackingNumber,
      barcode: trackingNumber,
      qrPayload: trackingNumber,
      pdfUrl: `${appUrl}/api/shipping/demo-label?tracking=${encodeURIComponent(trackingNumber)}`,
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
