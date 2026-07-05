import "server-only";

import { getShippoApiKey } from "@/lib/shipping/env";
import { ShippoError } from "@/lib/shipping/shippo/errors";
import type { ShippoHealthResult } from "@/lib/shipping/shippo/types";

const SHIPPO_API_BASE = "https://api.goshippo.com";

export type ShippoServiceLevel = {
  name?: string;
  token?: string;
};

export type ShippoRate = {
  object_id: string;
  amount: string;
  currency?: string;
  provider?: string;
  carrier?: string;
  servicelevel?: ShippoServiceLevel;
  estimated_days?: number;
  object_created?: string;
};

export type ShippoShipment = {
  object_id: string;
  rates: ShippoRate[];
  status?: string;
  messages?: Array<{ text?: string }>;
};

export type ShippoTransaction = {
  object_id: string;
  status: string;
  tracking_number?: string | null;
  label_url?: string | null;
  tracking_url_provider?: string | null;
  messages?: Array<{ text?: string }>;
};

export type ShippoAddressPayload = {
  name: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  validate: boolean;
};

export type ShippoParcelPayload = {
  length: string;
  width: string;
  height: string;
  distance_unit: "cm";
  weight: string;
  mass_unit: "kg";
};

export type ShippoAddress = ShippoAddressPayload & {
  object_id: string;
  zip?: string;
  street1?: string;
  street2?: string;
  city?: string;
  validation_results?: {
    is_valid?: boolean;
    messages?: Array<{ text?: string }>;
  };
};

export type ShippoParcel = ShippoParcelPayload & {
  object_id: string;
};

export type ShippoTrackHistoryItem = {
  status?: string;
  status_details?: string | null;
  location?: string | null;
  status_date?: string;
};

export type ShippoTrack = {
  object_id: string;
  carrier?: string;
  tracking_number?: string;
  tracking_status?: { status?: string; status_details?: string | null; status_date?: string };
  tracking_history?: ShippoTrackHistoryItem[];
};

type ShippoRequestInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function parseShippoError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      detail?: string;
      message?: string;
      error?: string;
    };
    return payload.detail ?? payload.message ?? payload.error ?? response.statusText;
  } catch {
    return response.statusText || "Shippo request failed";
  }
}

export async function shippoRequest<T>(path: string, init: ShippoRequestInit = {}): Promise<T> {
  const apiKey = getShippoApiKey();
  const response = await fetch(`${SHIPPO_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `ShippoToken ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await parseShippoError(response);
    throw new ShippoError("api_error", message, { statusCode: response.status });
  }

  return (await response.json()) as T;
}

export async function checkShippoApiHealth(): Promise<ShippoHealthResult> {
  const start = Date.now();
  await shippoRequest<{ results?: unknown[] }>("/shipments/?results=1&page=1");
  return {
    configured: true,
    status: "healthy",
    latencyMs: Date.now() - start,
    message: "Shippo API reachable",
  };
}

export async function createShippoAddress(payload: ShippoAddressPayload): Promise<ShippoAddress> {
  return shippoRequest<ShippoAddress>("/addresses/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createShippoParcel(payload: ShippoParcelPayload): Promise<ShippoParcel> {
  return shippoRequest<ShippoParcel>("/parcels/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createShippoShipment(input: {
  addressFrom: ShippoAddressPayload;
  addressTo: ShippoAddressPayload;
  parcel: ShippoParcelPayload;
}): Promise<ShippoShipment> {
  return shippoRequest<ShippoShipment>("/shipments/", {
    method: "POST",
    body: JSON.stringify({
      address_from: input.addressFrom,
      address_to: input.addressTo,
      parcels: [input.parcel],
      async: false,
    }),
  });
}

export async function purchaseShippoLabel(rateObjectId: string): Promise<ShippoTransaction> {
  return shippoRequest<ShippoTransaction>("/transactions/", {
    method: "POST",
    body: JSON.stringify({
      rate: rateObjectId,
      label_file_type: "PDF",
      async: false,
    }),
  });
}

export async function registerShippoTrack(input: {
  carrier: string;
  trackingNumber: string;
}): Promise<ShippoTrack> {
  return shippoRequest<ShippoTrack>("/tracks/", {
    method: "POST",
    body: JSON.stringify({
      carrier: input.carrier,
      tracking_number: input.trackingNumber,
    }),
  });
}

export async function getShippoTrack(trackObjectId: string): Promise<ShippoTrack> {
  return shippoRequest<ShippoTrack>(`/tracks/${encodeURIComponent(trackObjectId)}/`);
}
