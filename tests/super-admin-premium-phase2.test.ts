import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  allValidationsPass,
  buildOmegaModuleReport,
  computeOmegaCertification,
  createOmegaValidations,
} from "@/lib/super-admin/premium/omega-status";
import { createDefaultEnterpriseDashboard } from "@/lib/super-admin/premium/dashboard-standard";
import { isOmegaReadyPath, buildOmegaReadyRegistry } from "@/lib/super-admin/premium/omega-ready";

function listAdminFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listAdminFiles(full));
    else if (entry.name.endsWith("Admin.tsx")) out.push(full);
  }
  return out;
}

describe("enterprise admin shell migration", () => {
  it("wraps all 40 super admin modules in unified shell", () => {
    const adminDir = path.join(process.cwd(), "features/super-admin");
    const files = listAdminFiles(adminDir);
    expect(files.length).toBe(51);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const usesShell =
        content.includes("EnterpriseAdminShell") || content.includes("EnterpriseEngineAdminShell");
      expect(usesShell, `${path.relative(process.cwd(), file)} must use EnterpriseAdminShell`).toBe(true);
      expect(content.includes('<div className="ea-admin">'), `${path.relative(process.cwd(), file)} must not use legacy ea-admin wrapper`).toBe(false);
    }
  });
});

describe("omega status", () => {
  it("creates default validations as pass", () => {
    const validations = createOmegaValidations();
    expect(allValidationsPass(validations)).toBe(true);
  });

  it("computes certification at 100", () => {
    const validations = createOmegaValidations();
    const result = computeOmegaCertification(validations, 100);
    expect(result.certified).toBe(true);
    expect(result.productionReady).toBe(true);
  });

  it("builds module report", () => {
    const report = buildOmegaModuleReport({
      moduleId: "enterprise-development-center",
      pathname: "/super-admin/development",
      enterpriseScore: 99.6,
    });
    expect(report.productionReady).toBe(true);
    expect(report.validations.length).toBeGreaterThan(8);
  });
});

describe("enterprise dashboard standard", () => {
  it("creates default dashboard sections", () => {
    const dashboard = createDefaultEnterpriseDashboard("Test Module");
    expect(dashboard.kpis?.length).toBeGreaterThan(0);
    expect(dashboard.chartValues?.length).toBe(7);
    expect(dashboard.aiInsights?.length).toBe(1);
  });
});

describe("omega ready phase 2 coverage", () => {
  it("registers development and governance", () => {
    const registry = buildOmegaReadyRegistry();
    expect(registry.some((e) => e.href === "/super-admin/development")).toBe(true);
    expect(registry.some((e) => e.href === "/super-admin/governance")).toBe(true);
    expect(registry.some((e) => e.href === "/super-admin/omega")).toBe(true);
  });

  it("marks enterprise modules omega ready", () => {
    expect(isOmegaReadyPath("/super-admin/automation")).toBe(true);
    expect(isOmegaReadyPath("/super-admin/business-intelligence")).toBe(true);
  });
});
