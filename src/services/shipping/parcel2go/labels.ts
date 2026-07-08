import "server-only";

import type { Parcel2GoClient } from "@/src/services/shipping/parcel2go/client";
import { mapParcel2GoLabelResponse } from "@/src/services/shipping/parcel2go/mapper";
import type { Parcel2GoApiLabelResponse } from "@/src/services/shipping/parcel2go/types";
import { PARCEL2GO_API_PATHS } from "@/src/services/shipping/parcel2go/types";
import { ShipmentError } from "@/src/services/shipping/errors";
import type { GetLabelsRequest, Label, Shipment } from "@/src/services/shipping/types";

export async function getParcel2GoLabels(
  client: Parcel2GoClient,
  request: GetLabelsRequest,
  shipment: Shipment,
): Promise<Label[]> {
  const orderLineIdHmac = request.orderLineIdHmac ?? shipment.orderLineIdHmac;
  if (!orderLineIdHmac) {
    throw new ShipmentError("Parcel2Go label requires orderLineIdHmac from the paid order");
  }

  try {
    const response = await client.get<Parcel2GoApiLabelResponse>(
      PARCEL2GO_API_PATHS.label(orderLineIdHmac),
    );

    return [mapParcel2GoLabelResponse(response, shipment)];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parcel2Go label request failed";
    throw new ShipmentError(message, { cause: error });
  }
}
