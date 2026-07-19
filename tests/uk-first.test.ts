import { describe, expect, it } from "vitest";
import { SUPPORTED_COUNTRIES, ACTIVE_SUPPORTED_COUNTRIES, BUYER_REGIONS } from "@/lib/account/countries";
import {
  isUkMarketingContent,
  UK_ACTIVE_MARKET,
  UK_ACTIVE_SELLER_TYPES,
  UK_DEFAULT_COUNTRY,
  UK_DEFAULT_CURRENCY,
  UK_INACTIVE_MARKET_ARCHITECTURE,
  UK_MARKETING_LOCALE,
  UK_VAT_STATES,
  isActiveUkMarketCurrency,
  isInactiveNonUkArchitecture,
} from "@/lib/i18n/uk-first";

describe("UK-first marketplace", () => {
  it("uses GBP and United Kingdom as defaults", () => {
    expect(UK_DEFAULT_CURRENCY).toBe("GBP");
    expect(UK_DEFAULT_COUNTRY).toBe("United Kingdom");
    expect(SUPPORTED_COUNTRIES[0]?.name).toBe(UK_DEFAULT_COUNTRY);
    expect(SUPPORTED_COUNTRIES[0]?.active).toBe(true);
    expect(ACTIVE_SUPPORTED_COUNTRIES).toHaveLength(1);
    expect(BUYER_REGIONS).toEqual(["United Kingdom"]);
  });

  it("keeps marketing content in English UK regardless of UI locale", () => {
    expect(UK_MARKETING_LOCALE).toBe("en-GB");
    expect(isUkMarketingContent()).toBe(true);
  });

  it("locks UK First active market policy", () => {
    expect(UK_ACTIVE_MARKET.currency).toBe("GBP");
    expect(UK_ACTIVE_MARKET.taxRegime).toBe("UK");
    expect([...UK_ACTIVE_SELLER_TYPES]).toEqual(["uk_individual", "uk_business"]);
    expect([...UK_VAT_STATES]).toEqual(["vat_registered", "not_vat_registered"]);
    expect(isActiveUkMarketCurrency("EUR")).toBe(false);
    expect(UK_INACTIVE_MARKET_ARCHITECTURE.every((m) => m.active === false)).toBe(true);
    expect(isInactiveNonUkArchitecture("FR")).toBe(true);
  });
});
