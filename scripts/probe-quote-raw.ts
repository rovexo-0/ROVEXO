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

async function main(): Promise<void> {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const clientId = process.env.PARCEL2GO_CLIENT_ID ?? "";
  const clientSecret = process.env.PARCEL2GO_CLIENT_SECRET ?? "";
  const tokenRes = await fetch("https://www.parcel2go.com/auth/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "public-api payment",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  const token = tokenJson.access_token;
  if (!token) {
    console.error("no token", tokenJson);
    process.exit(1);
  }

  const payload = {
    CollectionAddress: {
      ContactName: "Jane Seller",
      Street: "Downing Street",
      Property: "10",
      Town: "London",
      Postcode: "SW1A 2AA",
      Country: "GBR",
    },
    DeliveryAddress: {
      ContactName: "John Buyer",
      Street: "Canada Square",
      Property: "1",
      Town: "London",
      Postcode: "E14 5AB",
      Country: "GBR",
    },
    Parcels: [{ Value: 50, Weight: 2, Length: 30, Width: 20, Height: 10 }],
  };

  const res = await fetch("https://www.parcel2go.com/api/quotes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log(JSON.stringify({ status: res.status, body: text.slice(0, 2000) }, null, 2));
  process.exit(res.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
