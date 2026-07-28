/**
 * Platform language coverage — English (UK) only.
 * Multi-language production gate retired.
 */

import { hasNativeCatalog } from "@/lib/i18n/messages";
import {
  LANGUAGE_ENGINE_CANONICAL_PRINCIPLE,
  LANGUAGE_ENGINE_PRODUCTION_RULE,
  PLATFORM_LANGUAGE_CODE,
} from "@/lib/i18n/platform-language";

export type LanguageCoverageLocaleReport = {
  locale: typeof PLATFORM_LANGUAGE_CODE;
  messageCatalog: boolean;
  uiPhraseCatalog: boolean;
  uiPhraseKeyParity: boolean;
  missingUiPhraseKeys: string[];
  pass: boolean;
};

export type LanguageEngineProductionGate = {
  version: "1.0";
  pass: boolean;
  blocked: boolean;
  locales: LanguageCoverageLocaleReport[];
  principle: typeof LANGUAGE_ENGINE_CANONICAL_PRINCIPLE;
  rule: typeof LANGUAGE_ENGINE_PRODUCTION_RULE;
};

export function evaluateLanguageEngineProductionGate(): LanguageEngineProductionGate {
  const pass = hasNativeCatalog(PLATFORM_LANGUAGE_CODE);
  return {
    version: "1.0",
    pass,
    blocked: !pass,
    locales: [
      {
        locale: PLATFORM_LANGUAGE_CODE,
        messageCatalog: pass,
        uiPhraseCatalog: true,
        uiPhraseKeyParity: true,
        missingUiPhraseKeys: [],
        pass,
      },
    ],
    principle: LANGUAGE_ENGINE_CANONICAL_PRINCIPLE,
    rule: LANGUAGE_ENGINE_PRODUCTION_RULE,
  };
}

export function assertLanguageEngineProductionReady(): void {
  const gate = evaluateLanguageEngineProductionGate();
  if (!gate.pass) {
    throw new Error("Platform language policy blocked — English (UK) catalog missing.");
  }
}

export const isLanguageEngineProductionBlocked = (): boolean =>
  evaluateLanguageEngineProductionGate().blocked;
