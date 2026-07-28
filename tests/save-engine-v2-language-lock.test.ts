import { describe, expect, it } from "vitest";
import {
  SAVE_ENGINE_COPY,
  SAVE_ENGINE_FORBIDDEN_UI,
  SAVE_ENGINE_RULES,
  SAVE_ENGINE_SENSITIVE_ACTIONS,
  SAVE_ENGINE_SUCCESS_MS,
  SAVE_ENGINE_VERSION,
  saveEngineSnapshot,
} from "@/lib/account/save-engine-v2";
import {
  PLATFORM_LANGUAGE_CODE,
  PLATFORM_LANGUAGE_LABEL,
  PLATFORM_LANGUAGE_REMOVED,
  resolvePlatformLanguage,
  platformLanguageSnapshot,
} from "@/lib/i18n/platform-language";
import { ACCOUNT_SETTINGS_DOM, ACCOUNT_SETTINGS_LAYOUT } from "@/lib/account/account-settings-v1";

describe("Save Engine v2.0 + English (UK) lock", () => {
  it("locks automatic save with zero save buttons", () => {
    expect(SAVE_ENGINE_VERSION).toBe("2.0");
    expect(SAVE_ENGINE_RULES.zeroSaveButtons).toBe(true);
    expect(SAVE_ENGINE_RULES.automaticSave).toBe(true);
    expect(SAVE_ENGINE_FORBIDDEN_UI).toContain("SAVE button");
    expect(SAVE_ENGINE_COPY.success).toBe("Saved Successfully ✓");
    expect(SAVE_ENGINE_SUCCESS_MS).toBeGreaterThanOrEqual(800);
    expect(SAVE_ENGINE_SUCCESS_MS).toBeLessThanOrEqual(1500);
    expect(SAVE_ENGINE_SENSITIVE_ACTIONS).toContain("Delete Account");
    expect(saveEngineSnapshot().rules.noReservedSaveButtonSpace).toBe(true);
  });

  it("locks platform language to English (UK) only", () => {
    expect(PLATFORM_LANGUAGE_CODE).toBe("en-GB");
    expect(PLATFORM_LANGUAGE_LABEL).toBe("English (UK)");
    expect(resolvePlatformLanguage("ro-RO")).toBe("en-GB");
    expect(resolvePlatformLanguage("de-DE")).toBe("en-GB");
    expect(PLATFORM_LANGUAGE_REMOVED).toContain("Language Engine");
    expect(PLATFORM_LANGUAGE_REMOVED).toContain("Language Picker");
    expect(platformLanguageSnapshot().multiLanguage).toBe(false);
  });

  it("removes Language and SAVE CHANGES from Account Settings layout", () => {
    expect(ACCOUNT_SETTINGS_DOM).toBe("v1.5");
    expect(ACCOUNT_SETTINGS_LAYOUT).not.toContain("Language");
    expect(ACCOUNT_SETTINGS_LAYOUT).not.toContain("SAVE CHANGES");
  });
});
