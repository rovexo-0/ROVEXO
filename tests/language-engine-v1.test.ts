import { describe, expect, it } from "vitest";
import { LANGUAGE_ENGINE_ACTIVE_CODES, resolvePlatformLanguage } from "@/lib/i18n/language-engine-v1";

describe("Language Engine v1 shim → English (UK) only", () => {
  it("re-exports English-only policy", () => {
    expect(LANGUAGE_ENGINE_ACTIVE_CODES).toEqual(["en-GB"]);
    expect(resolvePlatformLanguage("de-DE")).toBe("en-GB");
  });
});
