import { describe, expect, it } from "vitest";
import { translate, hasNativeCatalog } from "@/lib/i18n/messages";
import { LOCALE_OPTIONS } from "@/lib/i18n/config";
import { APP_DISPLAY_LOCALES } from "@/lib/i18n/app-locales";
import { UK_SHIPPING_CARRIERS } from "@/lib/i18n/shipping-carriers";
import { translateUi } from "@/lib/i18n/ui-phrases";
import { PLATFORM_LANGUAGE_CODE } from "@/lib/i18n/platform-language";
import { evaluateLanguageEngineProductionGate } from "@/lib/i18n/translation-coverage";

describe("i18n — English (UK) only", () => {
  it("defaults and displays English UK only", () => {
    expect(LOCALE_OPTIONS[0]?.code).toBe("en-GB");
    expect(APP_DISPLAY_LOCALES).toEqual([PLATFORM_LANGUAGE_CODE]);
  });

  it("keeps English chrome stable", () => {
    expect(translate("en-GB", "nav.search")).toBe("Search");
    expect(translate("en-GB", "nav.browse")).toBe("Browse");
    expect(translate("en-GB", "nav.saved")).toBe("Inbox");
    expect(translate("en-GB", "nav.account")).toBe("Account");
    expect(hasNativeCatalog("en-GB")).toBe(true);
  });

  it("falls back to English for any other locale request", () => {
    expect(translate("ro-RO", "account.title")).toBe("Contul meu");
    expect(translateUi("xx-XX", "Settings")).toBe("Settings");
  });

  it("lists UK shipping carriers", () => {
    expect(UK_SHIPPING_CARRIERS.map((c) => c.name)).toContain("Royal Mail");
    expect(UK_SHIPPING_CARRIERS.map((c) => c.name)).toContain("EVRi");
  });

  it("passes English-only production gate", () => {
    const gate = evaluateLanguageEngineProductionGate();
    expect(gate.pass).toBe(true);
    expect(gate.principle).toBe("ENGLISH (UK) ONLY");
  });
});
