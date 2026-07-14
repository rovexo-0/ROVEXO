import { describe, expect, it } from "vitest";
import { translate, hasNativeCatalog } from "@/lib/i18n/messages";
import { LOCALE_OPTIONS, SUPPORTED_LOCALE_CODES } from "@/lib/i18n/config";
import { APP_DISPLAY_LOCALES } from "@/lib/i18n/app-locales";
import { UK_SHIPPING_CARRIERS } from "@/lib/i18n/shipping-carriers";
import { hasUiPhraseCatalog, translateUi } from "@/lib/i18n/ui-phrases";

describe("i18n", () => {
  it("defaults English UK as first locale option", () => {
    expect(LOCALE_OPTIONS[0]?.code).toBe("en-GB");
  });

  it("exposes the seven display locales in the language picker", () => {
    expect(APP_DISPLAY_LOCALES).toEqual([
      "en-GB",
      "ro-RO",
      "de-DE",
      "fr-FR",
      "it-IT",
      "es-ES",
      "pl-PL",
    ]);
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

  it("ships native catalogs for the core supported languages", () => {
    expect(hasNativeCatalog("de-DE")).toBe(true);
    expect(hasNativeCatalog("fr-FR")).toBe(true);
    expect(hasNativeCatalog("it-IT")).toBe(true);
    expect(hasNativeCatalog("es-ES")).toBe(true);
    expect(hasNativeCatalog("nl-NL")).toBe(true);
    expect(hasNativeCatalog("pl-PL")).toBe(true);
    expect(translate("de-DE", "account.title")).toBe("Mein Konto");
    expect(translate("fr-FR", "account.title")).toBe("Mon compte");
    expect(translate("es-ES", "account.title")).toBe("Mi cuenta");
    expect(translate("pl-PL", "account.title")).toBe("Moje konto");
  });

  it("applies UI phrase localization for display languages", () => {
    for (const locale of APP_DISPLAY_LOCALES) {
      if (locale === "en-GB") continue;
      expect(hasUiPhraseCatalog(locale)).toBe(true);
      expect(translateUi(locale, "Settings")).not.toBe("Settings");
      expect(translateUi(locale, "Language updated.")).not.toBe("Language updated.");
    }
  });

  it("falls back to English for missing UI phrases and unknown locales", () => {
    expect(translateUi("ro-RO", "Totally Unknown Phrase XYZ")).toBe("Totally Unknown Phrase XYZ");
    expect(translateUi("xx-XX", "Settings")).toBe("Settings");
    expect(translate("hu-HU", "account.title")).toBe("My Account");
    expect(hasNativeCatalog("hu-HU")).toBe(false);
  });

  it("keeps English bottom-nav labels stable for the active chrome", () => {
    expect(translate("en-GB", "nav.search")).toBe("Browse");
    expect(translate("en-GB", "nav.saved")).toBe("Inbox");
    expect(translate("en-GB", "nav.account")).toBe("Profile");
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
