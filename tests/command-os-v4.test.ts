import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMMAND_OS_ONE_CLICK_OPERATIONS,
  COMMAND_OS_ROOT_MODULES,
  computeOverallPlatformScore,
  listCommandOsRootModules,
  searchCommandOs,
} from "@/lib/command-os-v4";
import { buildCommandOsHealthDimensions } from "@/lib/command-os-v4/health-center";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Command OS Enterprise v4.0", () => {
  it("defines 25 canonical root OS modules", () => {
    expect(COMMAND_OS_ROOT_MODULES).toHaveLength(25);
    expect(listCommandOsRootModules().map((mod) => mod.id)).toContain("experience-os");
    expect(listCommandOsRootModules().map((mod) => mod.id)).toContain("shipping-os");
    expect(listCommandOsRootModules().map((mod) => mod.id)).toContain("certification-center");
    expect(listCommandOsRootModules().map((mod) => mod.id)).toContain("emergency-center");
  });

  it("registers Command OS in Super Admin SSOT and navigation", () => {
    const registry = readSource("lib/super-admin/command-center/registry.ts");
    expect(registry).toContain('id: "command-os"');
    expect(registry).toContain('href: "/super-admin/command-os"');

    const nav = readSource("lib/super-admin/nav.ts");
    expect(nav).toContain("/super-admin/command-os");

    const quickActions = readSource("lib/super-admin/command-center-v1/build-sections.ts");
    expect(quickActions).toContain('id: "command-os"');
  });

  it("wires Command OS page, API, and styles", () => {
    const page = readSource("app/super-admin/command-os/page.tsx");
    expect(page).toContain("getCommandOsSnapshot");
    expect(page).toContain("CommandOsShell");

    const api = readSource("app/api/super-admin/command-os/route.ts");
    expect(api).toContain("getCommandOsSnapshot");
    expect(api).toContain("executeCommandOsAction");
    expect(api).toContain("requireApiSuperAdmin");

    const styles = readSource("styles/rovexo/index.css");
    expect(styles).toContain("command-os-v4.css");
  });

  it("exposes global search across Command OS registries", () => {
    const results = searchCommandOs("shipping");
    expect(results.some((item) => item.label.includes("Shipping"))).toBe(true);
    expect(results.some((item) => item.category === "Command OS")).toBe(true);
  });

  it("computes overall platform health score", () => {
    const dimensions = buildCommandOsHealthDimensions({ nocCards: [] });
    expect(dimensions.length).toBeGreaterThanOrEqual(10);
    expect(computeOverallPlatformScore(dimensions)).toBeGreaterThanOrEqual(80);
  });

  it("defines one-click operations for audit, certification, and health scan", () => {
    const actions = COMMAND_OS_ONE_CLICK_OPERATIONS.map((op) => op.action);
    expect(actions).toContain("run-full-audit");
    expect(actions).toContain("run-certification");
    expect(actions).toContain("health-scan");
    expect(actions).toContain("xos-rescan");
    expect(actions).toContain("backup-platform");
  });

  it("keeps certification engines server-side in actions module", () => {
    const actions = readSource("lib/command-os-v4/actions.ts");
    expect(actions).toContain("runBringYourItemCertification");
    expect(actions).toContain('"server-only"');
  });
});
