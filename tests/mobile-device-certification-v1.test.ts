import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MOBILE_DEVICE_CERTIFICATION_CONTRACT,
  MOBILE_DEVICE_CERTIFICATION_ID,
  MOBILE_DEVICE_EXTRA_PAGES,
  MOBILE_DEVICE_ORIENTATIONS,
  MOBILE_DEVICE_PAGES,
  MOBILE_DEVICE_PAD_CONTRACT,
  MOBILE_DEVICE_TARGETS,
  MOBILE_DEVICE_TOUCH_MIN_PX,
  assertMobileDeviceCertificationOrBlock,
  emptyMobileDeviceEvidence,
  evaluateMobileDeviceCertification,
  getMobileDevicePlaywrightProjectNames,
} from "@/lib/mobile/mobile-device-certification-v1";

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Mobile Device Certification Engine v1.0 — SSOT lock", () => {
  it("locks mobile-first contract + 16px pad + 44 touch", () => {
    expect(MOBILE_DEVICE_CERTIFICATION_ID).toBe("MOBILE_DEVICE_CERTIFICATION_ENGINE");
    expect(MOBILE_DEVICE_CERTIFICATION_CONTRACT.mobileFirst).toBe(true);
    expect(MOBILE_DEVICE_CERTIFICATION_CONTRACT.desktopSecondary).toBe(true);
    expect(MOBILE_DEVICE_PAD_CONTRACT.leftPx).toBe(16);
    expect(MOBILE_DEVICE_PAD_CONTRACT.rightPx).toBe(16);
    expect(MOBILE_DEVICE_TOUCH_MIN_PX).toBe(44);
    expect(MOBILE_DEVICE_ORIENTATIONS).toEqual(["portrait", "landscape"]);
  });

  it("covers Owner phone + tablet devices including iPhone 15 Pro", () => {
    const ids = MOBILE_DEVICE_TARGETS.map((t) => t.id);
    expect(ids).toContain("safari-ios-iphone-se");
    expect(ids).toContain("safari-ios-iphone-13");
    expect(ids).toContain("safari-ios-iphone-15");
    expect(ids).toContain("safari-ios-iphone-15-pro");
    expect(ids).toContain("safari-ios-iphone-15-pro-max");
    expect(ids).toContain("safari-ios-iphone-latest");
    expect(ids).toContain("chrome-android-pixel");
    expect(ids).toContain("chrome-android-samsung");
    expect(ids).toContain("chrome-android-fold");
    expect(ids).toContain("ipad-safari");
    expect(ids).toContain("android-tablet-chrome");
    expect(MOBILE_DEVICE_TARGETS.every((t) => t.family !== "desktop")).toBe(true);
  });

  it("covers Cross Browser pages + Sell · Settings · Review Bundle · Profile", () => {
    const ids = MOBILE_DEVICE_PAGES.map((p) => p.id);
    for (const required of [
      "homepage",
      "search",
      "categories",
      "listing",
      "view_item",
      "seller_profile",
      "buyer_profile",
      "messages",
      "offers",
      "bundle",
      "checkout",
      "orders",
      "wallet",
      "notifications",
      "profile",
      "settings",
      "sell",
      "review_bundle",
    ]) {
      expect(ids).toContain(required);
    }
    expect(MOBILE_DEVICE_EXTRA_PAGES.map((p) => p.id)).toEqual([
      "profile",
      "settings",
      "sell",
      "review_bundle",
    ]);
  });

  it("uses mdc-* Playwright projects (no collision with xcb-*)", () => {
    const names = getMobileDevicePlaywrightProjectNames();
    expect(names.every((n) => n.startsWith("mdc-"))).toBe(true);
    expect(names).toContain("mdc-safari-ios-iphone-15-pro");
  });

  it("wires runner + e2e + projects on disk", () => {
    expect(existsSync(join(process.cwd(), "scripts/run-mobile-device-certification.mjs"))).toBe(
      true,
    );
    expect(existsSync(join(process.cwd(), "e2e/mobile-device-certification.spec.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "scripts/playwright-mobile-device-projects.mjs"))).toBe(
      true,
    );
    expect(read("package.json")).toContain("test:e2e:mobile-device");
  });

  it("fail-closed when evidence is unverified", () => {
    const empty = emptyMobileDeviceEvidence();
    expect(evaluateMobileDeviceCertification(empty).pass).toBe(false);
    expect(() => assertMobileDeviceCertificationOrBlock(empty)).toThrow(/BLOCKED/);
  });
});
