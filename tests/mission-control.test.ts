import { describe, expect, it } from "vitest";
import {
  createDefaultAiToggles,
  createDefaultBannerManagerConfig,
  createDefaultFeatureToggles,
  createDefaultHomepageBuilderConfig,
  NOTIFICATION_PRIORITY_LEGEND,
} from "@/lib/super-admin/mission-control/defaults";
import { MISSION_CONTROL_MODULES, registerMissionControlModule } from "@/lib/super-admin/mission-control/registry";

describe("mission control defaults", () => {
  it("seeds homepage builder with all launch components", () => {
    const config = createDefaultHomepageBuilderConfig();
    expect(config.components.length).toBeGreaterThanOrEqual(12);
    expect(config.components.some((item) => item.id === "hero-slider")).toBe(true);
  });

  it("seeds banner manager from hero campaigns", () => {
    const config = createDefaultBannerManagerConfig();
    expect(config.banners.length).toBeGreaterThan(0);
    expect(config.banners.every((banner) => banner.cta.length > 0)).toBe(true);
  });

  it("defines AI and feature toggles", () => {
    const ai = createDefaultAiToggles();
    const features = createDefaultFeatureToggles();
    expect(ai.globalEnabled).toBe(true);
    expect(ai.features.length).toBeGreaterThanOrEqual(8);
    expect(features.length).toBeGreaterThanOrEqual(4);
  });

  it("maps notification severities to legend colors", () => {
    expect(NOTIFICATION_PRIORITY_LEGEND).toHaveLength(6);
    expect(NOTIFICATION_PRIORITY_LEGEND.map((item) => item.color)).toContain("red");
  });
});

describe("mission control registry", () => {
  it("registers core modules for shortcuts", () => {
    const ids = MISSION_CONTROL_MODULES.map((module) => module.id);
    expect(ids).toContain("homepage-builder");
    expect(ids).toContain("developer");
    expect(ids).toContain("ai-manager");
  });

  it("supports future module registration", () => {
    const next = registerMissionControlModule({
      id: "test-module",
      label: "Test Module",
      description: "Future module",
      href: "/super-admin/test-module",
      icon: "🧪",
      category: "platform",
    });
    expect(next.some((module) => module.id === "test-module")).toBe(true);
  });
});
