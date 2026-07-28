/**
 * Platform mode — driven by ROVEXO MASTER ENGINE activation latch.
 */

import { areProductionRulesActive } from "@/lib/master-engine/activation";
import {
  SMART_PLATFORM_SHOW_EVERYTHING_MODES,
  type SmartPlatformMode,
} from "@/lib/smart-platform/constants";

/**
 * Resolve current platform mode.
 * Defaults to local/show-everything unless production rules are activated.
 */
export function resolveSmartPlatformMode(): SmartPlatformMode {
  if (areProductionRulesActive()) {
    return "production";
  }

  const hint = (
    process.env.ROVEXO_PLATFORM_MODE ||
    process.env.ROVEXO_SMART_PLATFORM_MODE ||
    ""
  )
    .trim()
    .toLowerCase();

  if (hint === "qa") return "qa";
  if (hint === "demo") return "demo";
  if (hint === "certification" || hint === "cert") return "certification";
  if (hint === "visual" || hint === "visual-certification") return "visual-certification";
  if (hint === "e2e") return "e2e";
  // Explicit production hint ignored until activateProductionRules().
  if (process.env.NODE_ENV === "test") return "certification";
  return "local";
}

/** True when the platform must SHOW EVERYTHING (no production hiding). */
export function isSmartPlatformShowEverythingMode(): boolean {
  if (!areProductionRulesActive()) return true;
  const mode = resolveSmartPlatformMode();
  return (SMART_PLATFORM_SHOW_EVERYTHING_MODES as readonly string[]).includes(mode);
}

/**
 * Master production gate used by every sub-engine.
 * True only after `activateProductionRules()`.
 */
export function isSmartPlatformProductionActive(): boolean {
  return areProductionRulesActive();
}
