import { describe, expect, it } from "vitest";
import {
  LANGUAGE_ENGINE_ACTIVE_CODES,
  LANGUAGE_ENGINE_CANONICAL_PRINCIPLE,
  PLATFORM_LANGUAGE_CODE,
  resolvePlatformLanguage,
} from "@/lib/i18n/language-engine-v2";
import { evaluateLanguageEngineProductionGate } from "@/lib/i18n/translation-coverage";

describe("Platform language (former Language Engine v2)", () => {
  it("is English (UK) only", () => {
    expect(LANGUAGE_ENGINE_ACTIVE_CODES).toEqual(["en-GB"]);
    expect(LANGUAGE_ENGINE_CANONICAL_PRINCIPLE).toBe("ENGLISH (UK) ONLY");
    expect(resolvePlatformLanguage("ro-RO")).toBe(PLATFORM_LANGUAGE_CODE);
    expect(evaluateLanguageEngineProductionGate().pass).toBe(true);
  });
});
