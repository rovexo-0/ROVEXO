import "server-only";

import {
  getSendcloudBaseUrl,
  getSendcloudPublicKey,
  getSendcloudSecretKey,
} from "@/lib/shipping/env";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type {
  SendcloudHealthResult,
  SendcloudParcelResponse,
  SendcloudShippingMethod,
} from "@/lib/shipping/sendcloud/types";

function getAuthHeader(): string {
  const publicKey = getSendcloudPublicKey();
  const secretKey = getSendcloudSecretKey();
  const encoded = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
  return `Basic ${encoded}`;
}

async function sendcloudRequest<T>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | number | boolean | undefined> },
): Promise<T> {
  const baseUrl = getSendcloudBaseUrl();
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);

  if (init?.searchParams) {
    for (const [key, value] of Object.entries(init.searchParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: { message?: string } }).error?.message === "string"
        ? (body as { error: { message: string } }).error.message
        : `Sendcloud API error (${response.status})`;

    throw new SendcloudError("api_error", message, {
      statusCode: response.status,
      details: body,
    });
  }

  return body as T;
}

export async function checkSendcloudApiHealth(): Promise<SendcloudHealthResult> {
  const started = Date.now();
  try {
    await listSendcloudShippingMethods({ toCountry: "GB", toPostalCode: "SW1A 1AA", fromPostalCode: "SW1A 2AA" });
    return {
      configured: true,
      status: "healthy",
      latencyMs: Date.now() - started,
      baseUrl: getSendcloudBaseUrl(),
    };
  } catch (error) {
    return {
      configured: true,
      status: "unhealthy",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : String(error),
      baseUrl: getSendcloudBaseUrl(),
    };
  }
}

export async function listSendcloudShippingMethods(input: {
  toCountry: string;
  toPostalCode: string;
  fromPostalCode: string;
  fromCountry?: string;
  isReturn?: boolean;
}): Promise<SendcloudShippingMethod[]> {
  const response = await sendcloudRequest<{ shipping_methods?: SendcloudShippingMethod[] }>(
    "/shipping_methods",
    {
      method: "GET",
      searchParams: {
        to_country: input.toCountry,
        to_postal_code: input.toPostalCode,
        from_postal_code: input.fromPostalCode,
        from_country: input.fromCountry,
        is_return: input.isReturn ?? false,
      },
    },
  );

  return response.shipping_methods ?? [];
}

export type SendcloudParcelCreatePayload = {
  name: string;
  company_name?: string;
  address: string;
  house_number: string;
  city: string;
  postal_code: string;
  country: string;
  telephone?: string;
  email?: string;
  request_label: boolean;
  shipment: { id: number };
  weight: string;
  order_number?: string;
  reference?: string;
  length?: string;
  width?: string;
  height?: string;
  total_order_value?: string;
  total_order_value_currency?: string;
};

export async function createSendcloudParcel(
  parcel: SendcloudParcelCreatePayload,
): Promise<SendcloudParcelResponse> {
  const response = await sendcloudRequest<{
    parcel?: SendcloudParcelResponse;
    failed_parcels?: Array<{ parcel?: SendcloudParcelResponse; errors?: unknown }>;
  }>("/parcels", {
    method: "POST",
    body: JSON.stringify({ parcel }),
  });

  if (response.failed_parcels?.length) {
    const firstError = response.failed_parcels[0]?.errors;
    throw new SendcloudError(
      "label_failed",
      typeof firstError === "string" ? firstError : "Sendcloud failed to create parcel",
      { details: response.failed_parcels },
    );
  }

  if (!response.parcel) {
    throw new SendcloudError("label_failed", "Sendcloud returned no parcel in response");
  }

  return response.parcel;
}

export async function getSendcloudParcel(parcelId: number): Promise<SendcloudParcelResponse> {
  const response = await sendcloudRequest<{ parcel: SendcloudParcelResponse }>(`/parcels/${parcelId}`, {
    method: "GET",
  });
  return response.parcel;
}

export async function getSendcloudTracking(trackingNumber: string): Promise<SendcloudParcelResponse | null> {
  const response = await sendcloudRequest<{ parcels?: SendcloudParcelResponse[] }>("/parcels", {
    method: "GET",
    searchParams: { tracking_number: trackingNumber },
  });

  return response.parcels?.[0] ?? null;
}
