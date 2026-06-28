import { describe, expect, it } from "vitest";
import { ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR } from "@/lib/enterprise-development-center/descriptor";
import { buildDevelopmentNavSection } from "@/lib/super-admin/nav";
import { buildSuperAdminBreadcrumbs } from "@/lib/super-admin/premium/breadcrumbs";
import {
  buildOmegaReadyRegistry,
  getOmegaReadyEntry,
  isOmegaReadyPath,
  resetOmegaReadyRegistryCache,
} from "@/lib/super-admin/premium/omega-ready";
import { validateSuperAdminPageReadiness } from "@/lib/super-admin/premium/readiness";

describe("super admin premium breadcrumbs", () => {
  it("builds mission control root", () => {
    expect(buildSuperAdminBreadcrumbs("/super-admin")).toEqual([{ label: "Mission Control" }]);
  });

  it("builds development breadcrumbs from descriptor", () => {
    const crumbs = buildSuperAdminBreadcrumbs("/super-admin/development/module-explorer");
    expect(crumbs[0]?.href).toBe("/super-admin");
    expect(crumbs.at(-1)?.label).toBe("Module Explorer");
  });

  it("builds governance breadcrumbs", () => {
    const crumbs = buildSuperAdminBreadcrumbs("/super-admin/governance/validation");
    expect(crumbs.some((item) => item.label === "Validation")).toBe(true);
  });
});

describe("omega ready registry", () => {
  it("registers enterprise development center", () => {
    resetOmegaReadyRegistryCache();
    const registry = buildOmegaReadyRegistry();
    expect(registry.some((entry) => entry.moduleId === "enterprise-development-center")).toBe(true);
  });

  it("registers development sub routes", () => {
    resetOmegaReadyRegistryCache();
    const registry = buildOmegaReadyRegistry();
    expect(registry.some((entry) => entry.href === "/super-admin/development/api-studio")).toBe(true);
  });

  it("detects omega ready paths", () => {
    expect(isOmegaReadyPath("/super-admin/development")).toBe(true);
    expect(isOmegaReadyPath("/super-admin/governance")).toBe(true);
    expect(isOmegaReadyPath("/super-admin/unknown-stub")).toBe(false);
  });

  it("resolves omega ready entry", () => {
    const entry = getOmegaReadyEntry("/super-admin/development/build-center");
    expect(entry?.label).toBe("Build Center");
  });
});

describe("page readiness", () => {
  it("marks development center ready", () => {
    const result = validateSuperAdminPageReadiness("/super-admin/development");
    expect(result.ready).toBe(true);
    expect(result.omegaReady).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("marks mission control ready", () => {
    const result = validateSuperAdminPageReadiness("/super-admin");
    expect(result.ready).toBe(true);
  });
});

describe("development navigation", () => {
  it("builds descriptor-driven development section", () => {
    const section = buildDevelopmentNavSection();
    expect(section.id).toBe("development");
    expect(section.items.length).toBe(ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.routes.length);
    expect(section.items[0]?.href).toBe("/super-admin/development");
  });

  it("uses development module icon", () => {
    const section = buildDevelopmentNavSection();
    expect(section.items.every((item) => item.icon === ENTERPRISE_DEVELOPMENT_MODULE_DESCRIPTOR.icon)).toBe(true);
  });
});

describe("premium registry scale", () => {
  it("registers a substantial omega ready surface", () => {
    resetOmegaReadyRegistryCache();
    expect(buildOmegaReadyRegistry().length).toBeGreaterThan(100);
  });
});
