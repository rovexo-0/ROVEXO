import { describe, expect, it } from "vitest";
import { SUPPORTED_COUNTRIES } from "@/lib/account/countries";
import {
  isUkMarketingContent,
  UK_DEFAULT_COUNTRY,
  UK_DEFAULT_CURRENCY,
  UK_MARKETING_LOCALE,
} from "@/lib/i18n/uk-first";

describe("UK-first marketplace", () => {
  it("uses GBP and United Kingdom as defaults", () => {
    expect(UK_DEFAULT_CURRENCY).toBe("GBP");
    expect(UK_DEFAULT_COUNTRY).toBe("United Kingdom");
    expect(SUPPORTED_COUNTRIES[0]?.name).toBe(UK_DEFAULT_COUNTRY);
  });

  it("keeps marketing content in English UK regardless of UI locale", () => {
    expect(UK_MARKETING_LOCALE).toBe("en-GB");
    expect(isUkMarketingContent()).toBe(true);
  });
});
