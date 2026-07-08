/**
 * Live Parcel2Go Production validation — runs against the real API when
 * PARCEL2GO_RUN_LIVE_TESTS=1 and production credentials are configured.
 * OAuth is NOT modified; these are read-only / safe integration probes.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

function loadEnvFile(file: string): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

import { clearParcel2GoTokenCache } from "@/src/services/shipping/parcel2go/auth";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";

const RUN_LIVE = process.env.PARCEL2GO_RUN_LIVE_TESTS === "1" && isParcel2GoConfigured();

const sampleAddress = {
  fullName: "Jane Seller",
  line1: "10 Downing Street",
  city: "London",
  postcode: "SW1A 2AA",
  country: "United Kingdom",
};

const sampleParcel = {
  weightKg: 2,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  valueGbp: 50,
};

describe.skipIf(!RUN_LIVE)("Parcel2Go Production Live Integration", () => {
  beforeEach(() => {
    clearParcel2GoTokenCache();
  });

  afterEach(() => {
    clearParcel2GoTokenCache();
  });

  it("OAuth health check passes against production", async () => {
    const health = await parcel2GoProvider.healthCheck();
    expect(health.status).toBe("healthy");
    expect(health.oauthOk).toBe(true);
    expect(health.tokenObtained).toBe(true);
    expect(health.apiReachable).toBe(true);
    expect(health.environment).toBe("production");
  }, 30_000);

  it("fetches live quotes from production API", async () => {
    const quotes = await parcel2GoProvider.getQuotes({
      collectionAddress: sampleAddress,
      deliveryAddress: {
        fullName: "John Buyer",
        line1: "1 Canada Square",
        city: "London",
        postcode: "E14 5AB",
        country: "United Kingdom",
      },
      parcels: [sampleParcel],
    });

    expect(quotes.length).toBeGreaterThan(0);
    const firstRate = quotes[0]?.rates[0];
    expect(firstRate?.carrier).toBeTruthy();
    expect(firstRate?.amount).toBeGreaterThan(0);
    expect(firstRate?.currency).toBe("GBP");
    expect(firstRate?.serviceCode).toBeTruthy();
  }, 30_000);

  it("fetches live tracking for an invalid reference with expected error", async () => {
    await expect(
      parcel2GoProvider.getTracking({
        shipmentId: "invalid-p2g-reference",
        trackingNumber: "invalid-p2g-reference",
      }),
    ).rejects.toThrow();
  }, 30_000);
});
