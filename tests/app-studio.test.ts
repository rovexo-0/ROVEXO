import { describe, expect, it } from "vitest";
import { createDefaultAppStudioDocument } from "@/lib/app-studio/defaults";
import {
  APP_STUDIO_MODULES,
  APP_STUDIO_NAV_SECTIONS,
  APP_STUDIO_PAGE_TYPES,
  APP_STUDIO_SIMULATOR_DEVICES,
  registerAppStudioModule,
} from "@/lib/app-studio/registry";

describe("app studio", () => {
  it("creates default document with all enterprise centers", () => {
    const doc = createDefaultAppStudioDocument();
    expect(doc.customModules.length).toBeGreaterThan(0);
    expect(doc.pages.length).toBeGreaterThan(0);
    expect(doc.automations.length).toBeGreaterThan(0);
    expect(doc.security.roles.length).toBeGreaterThan(0);
    expect(doc.plugins.length).toBeGreaterThan(0);
    expect(doc.recoveryPoints.length).toBeGreaterThan(0);
    expect(doc.notificationAlerts.length).toBeGreaterThan(0);
  });

  it("registers all required platform modules", () => {
    const ids = APP_STUDIO_MODULES.map((m) => m.id);
    expect(ids).toContain("marketplace");
    expect(ids).toContain("mission-control");
    expect(ids).toContain("theme-studio");
    expect(ids).toContain("platform-studio");
    expect(ids).toContain("app-studio");
    expect(ids).toContain("settings");
  });

  it("supports navigation builder sections", () => {
    expect(APP_STUDIO_NAV_SECTIONS).toContain("bottomNav");
    expect(APP_STUDIO_NAV_SECTIONS).toContain("sellerNav");
    expect(APP_STUDIO_NAV_SECTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it("supports page builder types and simulator devices", () => {
    expect(APP_STUDIO_PAGE_TYPES).toContain("homepage");
    expect(APP_STUDIO_PAGE_TYPES).toContain("campaign");
    expect(APP_STUDIO_SIMULATOR_DEVICES).toContain("ultrawide");
    expect(APP_STUDIO_SIMULATOR_DEVICES).toContain("iphone");
  });

  it("allows future module registration", () => {
    const next = registerAppStudioModule({
      id: "test-module",
      label: "Test",
      icon: "🧪",
      category: "platform",
      status: "beta",
      version: "0.1",
      health: "healthy",
      performanceScore: 90,
      permissions: ["read"],
      dependencies: [],
    });
    expect(next.some((m) => m.id === "test-module")).toBe(true);
  });
});
