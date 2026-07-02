import { describe, expect, it } from "vitest";
import { createDefaultEnterpriseCoreDocument } from "@/lib/enterprise-core/defaults";
import {
  ENTERPRISE_CORE_REGISTRY,
  ENTERPRISE_CORE_SEARCH_CATEGORIES,
  ENTERPRISE_CORE_SETTING_GROUPS,
  registerEnterpriseCoreModule,
} from "@/lib/enterprise-core/registry";
import { searchEnterpriseCoreAdminRegistry } from "@/lib/enterprise-core/search";

describe("enterprise core", () => {
  it("creates default document with all enterprise centers", () => {
    const doc = createDefaultEnterpriseCoreDocument();
    expect(doc.notifications.length).toBeGreaterThan(0);
    expect(doc.backups.length).toBeGreaterThan(0);
    expect(doc.roles.length).toBeGreaterThan(0);
    expect(doc.updates.length).toBeGreaterThan(0);
    expect(doc.recoveryHistory.length).toBeGreaterThan(0);
    expect(doc.aiAssistant.capabilities.length).toBeGreaterThan(0);
  });

  it("registers unified enterprise modules", () => {
    const ids = ENTERPRISE_CORE_REGISTRY.map((m) => m.id);
    expect(ids).toContain("mission-control");
    expect(ids).toContain("theme-studio");
    expect(ids).toContain("platform-studio");
    expect(ids).toContain("app-studio");
    expect(ids).toContain("enterprise-core");
    expect(ids).toContain("developer-center");
    expect(ids).toContain("marketplace-center");
  });

  it("supports global search categories and settings groups", () => {
    expect(ENTERPRISE_CORE_SEARCH_CATEGORIES).toContain("audit");
    expect(ENTERPRISE_CORE_SEARCH_CATEGORIES).toContain("permissions");
    expect(ENTERPRISE_CORE_SETTING_GROUPS.some((g) => g.id === "enterprise-core")).toBe(true);
    expect(ENTERPRISE_CORE_SETTING_GROUPS.some((g) => g.id === "theme-studio")).toBe(true);
  });

  it("searches admin registry for configuration modules", () => {
    const results = searchEnterpriseCoreAdminRegistry("theme");
    expect(results.some((r) => r.title.toLowerCase().includes("theme"))).toBe(true);
  });

  it("allows future module registration", () => {
    const next = registerEnterpriseCoreModule({
      id: "test-center",
      label: "Test Center",
      icon: "🧪",
      description: "Future module",
      href: "/super-admin/test",
      category: "platform",
      version: "0.1",
      health: "healthy",
      autoRegister: true,
    });
    expect(next.some((m) => m.id === "test-center")).toBe(true);
  });
});
