/**
 * ROVEXO STORE SHOWCASE ENGINE v1.0 (LOCK) — tests.
 */

import { describe, expect, it, afterEach } from "vitest";
import {
  activateProductionPromotionRules,
  activateProductionRules,
  calculateStoreShowcaseDecay,
  deactivateProductionPromotionRules,
  deactivateProductionRules,
  getStoreShowcaseOffer,
  registerStoreShowcase,
  resolveFeatureVisibility,
  resolveStoreShowcaseVisibility,
  applyStoreShowcaseProductionRules,
} from "@/lib/master-engine";
import {
  STORE_SHOWCASE_DECAY_BY_DAY,
  STORE_SHOWCASE_FEATURE_ID,
  STORE_SHOWCASE_PRICE_CENTS,
  STORE_SHOWCASE_DURATION_DAYS,
} from "@/lib/promote";
import { evaluateStoreShowcaseAntiAbuse } from "@/lib/promote/anti-abuse-engine";
import { evaluateStoreShowcasePurchaseGate } from "@/lib/promote/store-showcase-engine";

describe("ROVEXO STORE SHOWCASE ENGINE v1.0 (LOCK)", () => {
  afterEach(() => {
    deactivateProductionRules();
    deactivateProductionPromotionRules();
  });

  it("locks a single 7-day £6.30 offer", () => {
    const offer = getStoreShowcaseOffer();
    expect(offer.durationDays).toBe(STORE_SHOWCASE_DURATION_DAYS);
    expect(offer.priceCents).toBe(STORE_SHOWCASE_PRICE_CENTS);
    expect(offer.priceLabel).toBe("£6.30");
    expect(offer.packageId).toBe("7d");
  });

  it("registers into Master Engine and shows everything before production", () => {
    registerStoreShowcase();
    expect(
      resolveFeatureVisibility(STORE_SHOWCASE_FEATURE_ID, {
        activeListingCount: 0,
        holidayModeEnabled: true,
      }).visible,
    ).toBe(true);
    expect(
      resolveStoreShowcaseVisibility({
        activeListingCount: 0,
        holidayModeEnabled: true,
      }),
    ).toMatchObject({ visible: true, enabled: true, mode: "show-everything" });
  });

  it("applies production listing + holiday rules", () => {
    expect(
      applyStoreShowcaseProductionRules({ activeListingCount: 0, holidayModeEnabled: false }),
    ).toMatchObject({ visible: false, reason: "hidden-insufficient-listings" });
    expect(
      applyStoreShowcaseProductionRules({ activeListingCount: 1, holidayModeEnabled: false }),
    ).toMatchObject({ visible: false, reason: "hidden-insufficient-listings" });
    expect(
      applyStoreShowcaseProductionRules({ activeListingCount: 2, holidayModeEnabled: true }),
    ).toMatchObject({ visible: true, enabled: false, reason: "disabled-holiday-mode" });
    expect(
      applyStoreShowcaseProductionRules({ activeListingCount: 2, holidayModeEnabled: false }),
    ).toMatchObject({ visible: true, enabled: true, reason: "available" });

    activateProductionPromotionRules();
    expect(
      resolveStoreShowcaseVisibility({ activeListingCount: 1, holidayModeEnabled: false }),
    ).toMatchObject({ visible: false, mode: "production" });
    expect(
      resolveFeatureVisibility(STORE_SHOWCASE_FEATURE_ID, {
        activeListingCount: 2,
        holidayModeEnabled: false,
      }).visible,
    ).toBe(true);
  });

  it("decays boost from day 1 to day 7 then expires with no advantage", () => {
    const start = new Date("2026-07-01T00:00:00.000Z");
    for (const [day, pct] of Object.entries(STORE_SHOWCASE_DECAY_BY_DAY)) {
      const now = new Date(start.getTime() + (Number(day) - 1) * 24 * 60 * 60 * 1000 + 1000);
      const decay = calculateStoreShowcaseDecay(start, now);
      expect(decay.day).toBe(Number(day));
      expect(decay.boostPercent).toBe(pct);
      expect(decay.active).toBe(true);
      expect(decay.expired).toBe(false);
      if (Number(day) === 7) expect(decay.maxRow).toBe(20);
      else expect(decay.maxRow).toBeNull();
    }

    const day8 = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 + 1000);
    const expired = calculateStoreShowcaseDecay(start, day8);
    expect(expired).toMatchObject({
      boostPercent: 0,
      active: false,
      expired: true,
      maxRow: null,
    });
  });

  it("blocks stacking, double boost, and enforces 24h wait", () => {
    expect(
      evaluateStoreShowcaseAntiAbuse({ hasActiveStoreShowcase: true }).allowed,
    ).toBe(false);

    const expiredAt = new Date("2026-07-10T12:00:00.000Z");
    const tooSoon = new Date(expiredAt.getTime() + 12 * 60 * 60 * 1000);
    expect(
      evaluateStoreShowcaseAntiAbuse({
        hasActiveStoreShowcase: false,
        lastExpiredAt: expiredAt.toISOString(),
        now: tooSoon,
      }).reason,
    ).toBe("repurchase-wait");

    const afterWait = new Date(expiredAt.getTime() + 25 * 60 * 60 * 1000);
    expect(
      evaluateStoreShowcaseAntiAbuse({
        hasActiveStoreShowcase: false,
        lastExpiredAt: expiredAt.toISOString(),
        now: afterWait,
      }).allowed,
    ).toBe(true);
  });

  it("purchase gate combines visibility + anti-abuse", () => {
    const blocked = evaluateStoreShowcasePurchaseGate({
      activeListingCount: 5,
      holidayModeEnabled: false,
      hasActiveStoreShowcase: true,
      productionRulesActive: true,
    });
    expect(blocked.canPurchase).toBe(false);

    const ok = evaluateStoreShowcasePurchaseGate({
      activeListingCount: 5,
      holidayModeEnabled: false,
      hasActiveStoreShowcase: false,
      productionRulesActive: true,
    });
    expect(ok.canPurchase).toBe(true);
  });

  it("activateProductionRules also activates promotion rules", () => {
    activateProductionRules();
    expect(
      resolveStoreShowcaseVisibility({ activeListingCount: 0, holidayModeEnabled: false }).mode,
    ).toBe("production");
  });
});
