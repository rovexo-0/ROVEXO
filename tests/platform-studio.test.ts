import { describe, expect, it } from "vitest";
import { createDefaultPlatformStudioDocument } from "@/lib/platform-studio/defaults";
import {
  PLATFORM_STUDIO_FIELD_TYPES,
  PLATFORM_STUDIO_MODULES,
  PLATFORM_STUDIO_PERMISSIONS,
  registerPlatformStudioModule,
} from "@/lib/platform-studio/registry";

describe("platform studio", () => {
  it("creates default document with all builder domains", () => {
    const doc = createDefaultPlatformStudioDocument();
    expect(doc.forms.length).toBeGreaterThan(0);
    expect(doc.workflows.length).toBeGreaterThan(0);
    expect(doc.dashboards.length).toBeGreaterThan(0);
    expect(doc.automations.length).toBeGreaterThan(0);
    expect(doc.roles.length).toBeGreaterThan(0);
    expect(doc.fieldConfigs.length).toBeGreaterThan(0);
    expect(doc.pages.length).toBeGreaterThan(0);
    expect(doc.componentRegistry.length).toBeGreaterThan(0);
  });

  it("registers all required platform modules", () => {
    const ids = PLATFORM_STUDIO_MODULES.map((m) => m.id);
    expect(ids).toContain("marketplace");
    expect(ids).toContain("mission-control");
    expect(ids).toContain("theme-studio");
    expect(ids).toContain("developer");
    expect(ids).toContain("analytics");
  });

  it("supports full field type palette", () => {
    expect(PLATFORM_STUDIO_FIELD_TYPES).toContain("ai-input");
    expect(PLATFORM_STUDIO_FIELD_TYPES).toContain("qr-code");
    expect(PLATFORM_STUDIO_FIELD_TYPES.length).toBeGreaterThan(30);
  });

  it("supports permission builder permissions", () => {
    expect(PLATFORM_STUDIO_PERMISSIONS).toContain("manage-theme");
    expect(PLATFORM_STUDIO_PERMISSIONS).toContain("manage-payments");
  });

  it("allows future module registration", () => {
    const next = registerPlatformStudioModule({
      id: "test-module",
      label: "Test",
      icon: "🧪",
      category: "platform",
      builders: ["forms"],
    });
    expect(next.some((m) => m.id === "test-module")).toBe(true);
  });
});
