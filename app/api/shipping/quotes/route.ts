import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { parcelTierLabel } from "@/lib/shipping/parcels";
import type { ShippingQuoteRequest } from "@/lib/shipping/pricing/provider";
import { fetchOrderShippingQuotes } from "@/lib/shipping/server";
import { ShippingService } from "@/lib/shipping/engine";
export const dynamic = "force-dynamic";

const quoteRequestSchema = z.object({
  orderId: z.string().uuid(),
  parcelTier: z.enum([
    "letter",
    "small_parcel",
    "medium_parcel",
    "large_parcel",
    "xl_parcel",
  ]),
  collectionAddress: z.object({
    role: z.enum(["buyer", "seller", "collection", "delivery"]),
    fullName: z.string().trim().min(1),
    line1: z.string().trim().min(1),
    city: z.string().trim().min(1),
    postcode: z.string().trim().min(1),
    country: z.string().trim().min(1),
    line2: z.string().optional(),
    county: z.string().optional(),
    phone: z.string().optional(),
    validated: z.boolean().optional(),
  }),
  deliveryAddress: z.object({
    role: z.enum(["buyer", "seller", "collection", "delivery"]),
    fullName: z.string().trim().min(1),
    line1: z.string().trim().min(1),
    city: z.string().trim().min(1),
    postcode: z.string().trim().min(1),
    country: z.string().trim().min(1),
    line2: z.string().optional(),
    county: z.string().optional(),
    phone: z.string().optional(),
    validated: z.boolean().optional(),
  }),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid shipping quote request." }, { status: 400 });
  }

  const collection = ShippingService.validateAddress({
    ...parsed.data.collectionAddress,
    validated: parsed.data.collectionAddress.validated ?? false,
  });
  const delivery = ShippingService.validateAddress({
    ...parsed.data.deliveryAddress,
    validated: parsed.data.deliveryAddress.validated ?? false,
  });

  if (!collection.valid || !delivery.valid) {
    return NextResponse.json(
      {
        error: "Invalid shipping address.",
        details: [
          ...(collection.valid ? [] : collection.errors),
          ...(delivery.valid ? [] : delivery.errors),
        ],
      },
      { status: 400 },
    );
  }

  const quoteRequest: ShippingQuoteRequest = {
    parcelTier: parsed.data.parcelTier,
    collectionAddress: collection.normalized,
    deliveryAddress: delivery.normalized,
  };

  const pricing = await fetchOrderShippingQuotes(parsed.data.orderId, quoteRequest);

  return NextResponse.json({
    pricing,
    parcelTierLabel: parcelTierLabel(parsed.data.parcelTier),
  });
}
