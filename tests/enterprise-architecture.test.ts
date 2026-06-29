import { describe, expect, it } from "vitest";
import { versionedApiPath, ENTERPRISE_API_VERSION } from "@/lib/enterprise-architecture/constants";
import { createDefaultFeatureFlags, isFeatureEnabled, mergeFeatureFlags } from "@/lib/enterprise-architecture/feature-flags";
import { canAccessModule, canPerformModuleAction } from "@/lib/enterprise-architecture/permissions";
import {
  getEnterpriseModuleApi,
  getEnterpriseModuleDescriptor,
  getEnterpriseModuleRoutes,
  listEnterpriseModuleDescriptors,
} from "@/lib/enterprise-architecture/registry";
import { buildEnterprisePrimaryNavItems } from "@/lib/enterprise-architecture/navigation";
import { INCIDENT_COMMAND_MODULE_DESCRIPTOR } from "@/lib/incident-command-center-engine/descriptor";
import { INCIDENT_TIMELINE_MODULE_DESCRIPTOR } from "@/lib/incident-timeline-engine/descriptor";
import { ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR } from "@/lib/enterprise-compliance-center-engine/descriptor";

describe("enterprise-architecture registry", () => {
  it("auto-discovers SA-005 through SA-008 module descriptors", () => {
    const ids = listEnterpriseModuleDescriptors().map((module) => module.id);
    expect(ids).toContain("incident-command-center");
    expect(ids).toContain("incident-timeline");
    expect(ids).toContain("enterprise-compliance-center");
  });

  it("exposes registry-driven routes without hardcoding in consumers", () => {
    const routes = getEnterpriseModuleRoutes("incident-command-center");
    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0]?.href).toMatch(/^\/super-admin\//);
  });

  it("provides version-ready API paths", () => {
    const api = getEnterpriseModuleApi("enterprise-compliance-center");
    expect(api?.v1Snapshot).toBe("/api/v1/super-admin/compliance");
    expect(api?.v1Action).toBe("/api/v1/super-admin/compliance/action");
    expect(versionedApiPath("/super-admin/compliance")).toBe("/api/v1/super-admin/compliance");
  });

  it("builds primary navigation from registry", () => {
    const nav = buildEnterprisePrimaryNavItems();
    expect(nav.some((item) => item.href === INCIDENT_COMMAND_MODULE_DESCRIPTOR.baseHref)).toBe(true);
    expect(nav.some((item) => item.href === INCIDENT_TIMELINE_MODULE_DESCRIPTOR.baseHref)).toBe(true);
    expect(nav.some((item) => item.href === ENTERPRISE_COMPLIANCE_MODULE_DESCRIPTOR.baseHref)).toBe(true);
  });
});

describe("enterprise-architecture feature flags", () => {
  it("defaults feature flags from module descriptor", () => {
    const flags = createDefaultFeatureFlags(INCIDENT_COMMAND_MODULE_DESCRIPTOR.featureFlags);
    expect(flags["live-dashboard"]).toBe(true);
    expect(flags["emergency-actions"]).toBe(true);
  });

  it("respects live overrides", () => {
    const merged = mergeFeatureFlags(INCIDENT_COMMAND_MODULE_DESCRIPTOR, { "ori-analysis": false });
    expect(merged["ori-analysis"]).toBe(false);
    expect(isFeatureEnabled("incident-command-center", "ori-analysis", merged)).toBe(false);
  });
});

describe("enterprise-architecture permissions", () => {
  it("allows super-admin module access", () => {
    expect(canAccessModule("incident-timeline")).toBe(true);
  });

  it("blocks protected config actions without MFA", () => {
    const result = canPerformModuleAction({
      moduleId: "incident-command-center",
      action: "publish-config",
      mfaVerified: false,
    });
    expect(result.allowed).toBe(false);
  });

  it("allows view actions without MFA", () => {
    const result = canPerformModuleAction({
      moduleId: "enterprise-compliance-center",
      action: "view",
    });
    expect(result.allowed).toBe(true);
  });
});

describe("enterprise-architecture constants", () => {
  it("uses v1 API version prefix", () => {
    expect(ENTERPRISE_API_VERSION).toBe("v1");
    expect(getEnterpriseModuleDescriptor("incident-command-center")?.api.v1Snapshot).toContain("/api/v1/");
  });
});
