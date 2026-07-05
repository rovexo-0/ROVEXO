import { describe, expect, it } from "vitest";
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
  });

  it("keeps marketing content in English UK regardless of UI locale", () => {
    expect(UK_MARKETING_LOCALE).toBe("en-GB");
    expect(isUkMarketingContent()).toBe(true);
  });
});
