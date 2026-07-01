import { describe, expect, it } from "vitest";
import { translate, hasNativeCatalog } from "@/lib/i18n/messages";
import { LOCALE_OPTIONS, SUPPORTED_LOCALE_CODES } from "@/lib/i18n/config";
import { UK_SHIPPING_CARRIERS } from "@/lib/i18n/shipping-carriers";

describe("i18n", () => {
  it("defaults English UK as first locale option", () => {
    expect(LOCALE_OPTIONS[0]?.code).toBe("en-GB");
  });

  it("includes Romanian and extended EU locales", () => {
    expect(SUPPORTED_LOCALE_CODES).toContain("ro-RO");
    expect(SUPPORTED_LOCALE_CODES).toContain("de-DE");
    expect(SUPPORTED_LOCALE_CODES).toContain("uk-UA");
    expect(SUPPORTED_LOCALE_CODES.length).toBeGreaterThanOrEqual(14);
  });

  it("translates account title in Romanian", () => {
    expect(translate("ro-RO", "account.title")).toBe("Contul meu");
    expect(hasNativeCatalog("ro-RO")).toBe(true);
  });

  it("falls back to English UK for locales without native catalog", () => {
    expect(translate("de-DE", "account.title")).toBe("My Account");
    expect(hasNativeCatalog("de-DE")).toBe(false);
  });

  it("lists UK shipping carriers with official names", () => {
    expect(UK_SHIPPING_CARRIERS.map((c) => c.name)).toContain("Royal Mail");
    expect(UK_SHIPPING_CARRIERS.map((c) => c.name)).toContain("FedEx UK");
  });

  it("supports Arabic RTL locale", () => {
    expect(SUPPORTED_LOCALE_CODES).toContain("ar-SA");
    expect(LOCALE_OPTIONS.find((e) => e.code === "ar-SA")?.direction).toBe("rtl");
  });
});
