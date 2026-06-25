import { describe, expect, it } from "vitest";
import {
  countryCodeToFlag,
  getCountryName,
  normalizeCountryCode,
} from "@/lib/analytics/live-countries/countries";

describe("live countries geography helpers", () => {
  it("normalizes country codes from edge headers", () => {
    expect(normalizeCountryCode("gb")).toBe("GB");
    expect(normalizeCountryCode("ZZ")).toBeNull();
    expect(normalizeCountryCode("(not set)")).toBeNull();
  });

  it("builds flag emoji from ISO codes", () => {
    expect(countryCodeToFlag("GB")).toBe("🇬🇧");
    expect(countryCodeToFlag("DE")).toBe("🇩🇪");
  });

  it("resolves country names dynamically", () => {
    expect(getCountryName("GB")).toBe("United Kingdom");
    expect(getCountryName("DE")).toBe("Germany");
  });
});
