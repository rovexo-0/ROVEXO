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

  const { parcel2GoProvider } = await import("@/src/services/shipping/parcel2go/provider");

  const address = {
    fullName: "Jane Seller",
    line1: "10 Downing Street",
    city: "London",
    postcode: "SW1A 2AA",
    country: "United Kingdom",
  };

  const quotes = await parcel2GoProvider.getQuotes({
    collectionAddress: address,
    deliveryAddress: {
      ...address,
      fullName: "John Buyer",
      line1: "1 Canada Square",
      postcode: "E14 5AB",
      city: "London",
    },
    parcels: [{ weightKg: 2, lengthCm: 30, widthCm: 20, heightCm: 10, valueGbp: 50 }],
  });

  console.log(JSON.stringify({ ok: true, count: quotes.length, sample: quotes[0]?.rates[0] }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
