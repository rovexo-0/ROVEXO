import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADDRESS_ENGINE_DEFAULTS,
  ADDRESS_ENGINE_FORBIDDEN,
  ADDRESS_ENGINE_LOCKS,
  ADDRESS_ENGINE_POSTCODE_ROLE,
  ADDRESS_ENGINE_STATUS,
  addressEngineSnapshot,
} from "@/lib/addresses/address-engine-v1";
import { lookupUkAddressesByPostcode } from "@/lib/addresses/uk-lookup";

const root = process.cwd();

describe("ROVEXO Address Engine v1.0", () => {
  it("locks permanent platform rule", () => {
    expect(ADDRESS_ENGINE_STATUS).toBe("PERMANENTLY LOCKED");
    expect(ADDRESS_ENGINE_POSTCODE_ROLE).toBe("LOOKUP_ONLY");
    expect(ADDRESS_ENGINE_DEFAULTS.unlimitedAddressesPerPostcode).toBe(true);
    expect(ADDRESS_ENGINE_DEFAULTS.samePostcodeMultipleAddressesAllowed).toBe(true);
    expect(ADDRESS_ENGINE_LOCKS.addressIsUniqueEntity).toBe(true);
    expect(ADDRESS_ENGINE_FORBIDDEN).toContain("use postcode as unique identifier");
    expect(addressEngineSnapshot().goldenRule).toContain("POSTCODE IS NEVER THE UNIQUE");
  });

  it("lookup returns multiple addresses for one postcode (WS2 9RD)", async () => {
    const results = await lookupUkAddressesByPostcode("WS29RD");
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((row) => row.postcode === "WS2 9RD")).toBe(true);
    const lines = results.map((row) => row.line1);
    expect(lines).toContain("83 Darlaston Road");
    expect(lines).toContain("85 Darlaston Road");
    expect(lines).toContain("87 Darlaston Road");
    expect(lines).toContain("Flat 1");
    expect(lines).toContain("Unit 1");
  });

  it("repository matches full address entity — not postcode alone", () => {
    const source = readFileSync(join(root, "lib/addresses/repository.ts"), "utf8");
    expect(source).toContain("Address Engine v1.0");
    expect(source).toContain("NOT postcode uniqueness");
    expect(source).toContain("address_line_2");
    expect(source).toContain("row.city");
    expect(source).toContain("row.country");
    // Must not short-circuit uniqueness on postcode-only equality without line1.
    expect(source).not.toMatch(
      /sanitizeText\(row\.postcode\)\.toLowerCase\(\) === normalizedPostcode\s*\)\s*;\s*$/m,
    );
  });

  it("DB default uniqueness is per type only — no postcode unique index", () => {
    const migration = readFileSync(
      join(root, "supabase/migrations/20250628000002_v1_account_production_complete.sql"),
      "utf8",
    );
    expect(migration).toContain("shipping_addresses_one_default_per_type_idx");
    expect(migration).not.toMatch(/unique.*postcode|postcode.*unique/i);
  });
});
