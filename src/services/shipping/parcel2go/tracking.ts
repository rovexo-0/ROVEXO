import "server-only";

import type { Parcel2GoClient } from "@/src/services/shipping/parcel2go/client";
import { mapParcel2GoTrackingToStatus } from "@/src/services/shipping/parcel2go/mapper";
import type { Parcel2GoApiTrackingResponse } from "@/src/services/shipping/parcel2go/types";
import { PARCEL2GO_API_PATHS } from "@/src/services/shipping/parcel2go/types";
import { TrackingError } from "@/src/services/shipping/errors";
import type { GetTrackingRequest, TrackingStatus } from "@/src/services/shipping/types";

export async function getParcel2GoTracking(
  client: Parcel2GoClient,
  request: GetTrackingRequest,
): Promise<TrackingStatus> {
  const reference = request.trackingNumber ?? request.shipmentId;
  if (!reference) {
    throw new TrackingError("Parcel2Go tracking requires a shipment id or tracking number");
  }

  try {
    const response = await client.get<Parcel2GoApiTrackingResponse>(
      PARCEL2GO_API_PATHS.tracking(reference),
    );

    return mapParcel2GoTrackingToStatus(response, request.shipmentId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parcel2Go tracking request failed";
    throw new TrackingError(message, { cause: error });
  }
}
