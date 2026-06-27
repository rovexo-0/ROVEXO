import { describe, expect, it } from "vitest";
import {
  extractLegacyListingLocation,
  matchManualCity,
  resolveCityFromGeocodeAddress,
  resolveProductLocationCity,
  sanitizeListingLocationCity,
  stripListingLocationMarker,
} from "@/lib/sell/listing-location";

describe("listing location helpers", () => {
  it("sanitizes city names and rejects HTML markers", () => {
    expect(sanitizeListingLocationCity("  Manchester  ")).toBe("Manchester");
    expect(sanitizeListingLocationCity("<!--bad-->")).toBeNull();
    expect(sanitizeListingLocationCity(null)).toBeNull();
  });

  it("reads location_city first and falls back to legacy description markers", () => {
    expect(resolveProductLocationCity("London", "legacy <!--rovexo-city:Manchester-->")).toBe(
      "London",
    );
    expect(
      resolveProductLocationCity(null, "Item details.\n\n<!--rovexo-city:Manchester-->"),
    ).toBe("Manchester");
  });

  it("strips legacy markers from displayed descriptions", () => {
    const description = "Great trainers in good condition.\n\n<!--rovexo-city:Manchester-->";
    expect(stripListingLocationMarker(description)).toBe("Great trainers in good condition.");
    expect(extractLegacyListingLocation(description)).toBe("Manchester");
  });

  it("prefers city, town, or village from reverse geocode addresses", () => {
    expect(
      resolveCityFromGeocodeAddress({
        city: "Manchester",
        county: "Greater Manchester",
      }),
    ).toBe("Manchester");

    expect(
      resolveCityFromGeocodeAddress({
        town: "Wimbledon",
        county: "Greater London",
      }),
    ).toBe("Wimbledon");

    expect(
      resolveCityFromGeocodeAddress({
        village: "Sample Village",
      }),
    ).toBe("Sample Village");
  });

  it("matches manual cities with diacritics", () => {
    expect(matchManualCity("Galati")).toBe("Galați");
    expect(matchManualCity("Cluj-Napoca")).toBe("Cluj-Napoca");
  });
});
