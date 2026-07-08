import "server-only";

import type { Parcel2GoClient } from "@/src/services/shipping/parcel2go/client";
import { mapParcel2GoQuotesResponse, mapAddressToParcel2Go } from "@/src/services/shipping/parcel2go/mapper";
import type { Parcel2GoApiQuoteResponse } from "@/src/services/shipping/parcel2go/types";
import { PARCEL2GO_API_PATHS } from "@/src/services/shipping/parcel2go/types";
import { QuoteError } from "@/src/services/shipping/errors";
import type { GetQuotesRequest, ShippingQuote } from "@/src/services/shipping/types";

export async function getParcel2GoQuotes(
  client: Parcel2GoClient,
  request: GetQuotesRequest,
): Promise<ShippingQuote[]> {
  const payload = {
    CollectionAddress: mapAddressToParcel2Go(request.collectionAddress),
    DeliveryAddress: mapAddressToParcel2Go(request.deliveryAddress),
    Parcels: request.parcels.map((parcel) => ({
      Value: parcel.valueGbp ?? 0,
      Weight: parcel.weightKg,
      Length: parcel.lengthCm,
      Width: parcel.widthCm,
      Height: parcel.heightCm,
    })),
  };

  try {
    const response = await client.post<Parcel2GoApiQuoteResponse>(PARCEL2GO_API_PATHS.quotes, payload);
    const quotes = mapParcel2GoQuotesResponse(response);

    if (quotes.length === 0) {
      throw new QuoteError("Parcel2Go returned no shipping services for this shipment");
    }

    return quotes;
  } catch (error) {
    if (error instanceof QuoteError) throw error;
    const message = error instanceof Error ? error.message : "Parcel2Go quote request failed";
    throw new QuoteError(message, { cause: error });
  }
}
