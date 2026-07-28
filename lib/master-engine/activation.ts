/**
 * ROVEXO MASTER ENGINE v1.0 (LOCK) — Global SSOT.
 *
 * ONE PLATFORM → ONE SMART ENGINE → ONE ACTIVATION SWITCH → ONE SINGLE CODE.
 *
 * Local / QA / Demo / Certification / Visual / E2E → SHOW EVERYTHING.
 * Production rules apply ONLY after `activateProductionRules()`.
 *
 * Do not call `activateProductionRules()` until Owner production cutover.
 */

import {
  SMART_PLATFORM_ENGINE_ACTIVE as DEFAULT_ACTIVE,
  SMART_PLATFORM_ENGINE_VERSION,
  SMART_PLATFORM_PRODUCTION_READY,
} from "@/lib/smart-platform/constants";

export const MASTER_ENGINE_NAME = "ROVEXO MASTER ENGINE" as const;
export const MASTER_ENGINE_VERSION = "v1.0" as const;
export const MASTER_ENGINE_PRODUCTION_READY = SMART_PLATFORM_PRODUCTION_READY;

/** Compile-time default — always false until Owner cutover. */
export const MASTER_ENGINE_DEFAULT_ACTIVE = false as boolean;

/**
 * Runtime activation latch.
 * Starts false. Flipped only by `activateProductionRules()` / `deactivateProductionRules()`.
 */
let productionRulesLatched = DEFAULT_ACTIVE === true;

/**
 * Promotion / Store Showcase production smart rules latch.
 * Also flipped by `activateProductionRules()` (single Owner cutover switch).
 */
let productionPromotionRulesLatched = false;

/** True when production visibility / money / verified rules are live. */
export function areProductionRulesActive(): boolean {
  return productionRulesLatched === true;
}

/** True when Store Showcase / promotion smart rules are live. */
export function areProductionPromotionRulesActive(): boolean {
  return productionPromotionRulesLatched === true || areProductionRulesActive();
}

/**
 * THE single activation switch for the entire platform.
 * Owner calls this immediately before production deploy — nowhere else.
 * Also activates promotion / Store Showcase production rules.
 */
export function activateProductionRules(): {
  ok: true;
  active: true;
  engine: typeof MASTER_ENGINE_NAME;
  version: typeof MASTER_ENGINE_VERSION;
} {
  productionRulesLatched = true;
  productionPromotionRulesLatched = true;
  return {
    ok: true,
    active: true,
    engine: MASTER_ENGINE_NAME,
    version: MASTER_ENGINE_VERSION,
  };
}

/**
 * Activate Store Showcase / promotion production smart rules only.
 * Prefer `activateProductionRules()` at Owner cutover.
 */
export function activateProductionPromotionRules(): {
  ok: true;
  active: true;
  api: "activateProductionPromotionRules()";
} {
  productionPromotionRulesLatched = true;
  return {
    ok: true,
    active: true,
    api: "activateProductionPromotionRules()",
  };
}

/**
 * Deactivate production rules (local / QA / certification restore SHOW EVERYTHING).
 * Not for production use after go-live without Owner approval.
 */
export function deactivateProductionRules(): {
  ok: true;
  active: false;
  engine: typeof MASTER_ENGINE_NAME;
  version: typeof MASTER_ENGINE_VERSION;
} {
  productionRulesLatched = false;
  productionPromotionRulesLatched = false;
  return {
    ok: true,
    active: false,
    engine: MASTER_ENGINE_NAME,
    version: MASTER_ENGINE_VERSION,
  };
}

export function deactivateProductionPromotionRules(): {
  ok: true;
  active: false;
  api: "deactivateProductionPromotionRules()";
} {
  productionPromotionRulesLatched = false;
  return {
    ok: true,
    active: false,
    api: "deactivateProductionPromotionRules()",
  };
}

export function getMasterEngineSnapshot() {
  return {
    name: MASTER_ENGINE_NAME,
    version: MASTER_ENGINE_VERSION,
    platformVersion: SMART_PLATFORM_ENGINE_VERSION,
    productionReady: MASTER_ENGINE_PRODUCTION_READY,
    active: areProductionRulesActive(),
    productionPromotionRulesActive: areProductionPromotionRulesActive(),
    activationApi: "activateProductionRules()",
    promotionActivationApi: "activateProductionPromotionRules()",
  };
}
