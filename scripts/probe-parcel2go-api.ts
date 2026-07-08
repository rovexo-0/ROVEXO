#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(file: string): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

loadEnvFile(".env.local");

async function getToken(): Promise<string> {
  const authUrl = process.env.PARCEL2GO_AUTH_URL!.replace(/\/+$/, "");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "public-api payment",
    client_id: process.env.PARCEL2GO_CLIENT_ID!,
    client_secret: process.env.PARCEL2GO_CLIENT_SECRET!,
  });
  const res = await fetch(`${authUrl}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.access_token!;
}

async function api(method: string, path: string, body?: unknown) {
  const token = await getToken();
  const base = process.env.PARCEL2GO_API_URL!.replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    // keep text
  }
  return { status: res.status, json };
}

const quotePayload = {
  CollectionAddress: {
    ContactName: "Seller",
    Street: "10 Downing Street",
    Town: "London",
    Postcode: "SW1A 2AA",
    Country: "GBR",
  },
  DeliveryAddress: {
    ContactName: "Buyer",
    Street: "221B Baker Street",
    Town: "London",
    Postcode: "NW1 6XE",
    Country: "GBR",
  },
  Parcels: [{ Value: 50, Weight: 2, Length: 30, Width: 20, Height: 10 }],
};

const quote = await api("POST", "/api/quotes", quotePayload);
const quotes = (quote.json as { Quotes?: unknown[] }).Quotes ?? [];
const first = quotes[0] as Record<string, unknown> | undefined;
const service = first?.Service as Record<string, unknown> | undefined;

console.log("QUOTE_SAMPLE", JSON.stringify({
  status: quote.status,
  keys: first ? Object.keys(first) : [],
  serviceSlug: service?.Slug,
  courierName: service?.CourierName,
  totalPrice: first?.TotalPrice,
  estimatedDeliveryDate: first?.EstimatedDeliveryDate,
}, null, 2));

console.log("ORDERS_LIST", JSON.stringify(await api("GET", "/api/orders?page=1&pageSize=1"), null, 2).slice(0, 1500));
