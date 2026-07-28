import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PRIORITY_0_BUILD_MUST_LIVE_V1 } from "@/lib/priority-0-build-must-live-v1";
import { PRIORITY_0_V1 } from "@/lib/priority-0-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Priority 0 — Build Must Live", () => {
  it("locks Build Must Live markers", () => {
    expect(PRIORITY_0_BUILD_MUST_LIVE_V1.codename).toBe("BUILD_MUST_LIVE");
    expect(PRIORITY_0_BUILD_MUST_LIVE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(PRIORITY_0_BUILD_MUST_LIVE_V1.productDoesNotExistIfFail).toContain("BUILD");
    expect(PRIORITY_0_BUILD_MUST_LIVE_V1.productDoesNotExistIfFail).toContain("CSS");
    expect(PRIORITY_0_BUILD_MUST_LIVE_V1.sprintersBlockedUntil).toContain("BUILD_PASS");
  });

  it("validates styles/rovexo/index.css imports exist and are non-empty", () => {
    const indexPath = PRIORITY_0_BUILD_MUST_LIVE_V1.entrypoints.designSystemCss;
    const index = readSource(indexPath);
    expect(index.trim().length).toBeGreaterThan(0);
    const imports = [...index.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(10);
    const duplicates = imports.filter((item, index) => imports.indexOf(item) !== index);
    expect(duplicates).toEqual([]);
    const base = dirname(resolve(process.cwd(), indexPath));
    for (const rel of imports) {
      const full = resolve(base, rel);
      expect(existsSync(full), `missing CSS import: ${rel}`).toBe(true);
      expect(readFileSync(full, "utf8").trim().length, `empty CSS import: ${rel}`).toBeGreaterThan(0);
    }
  });

  it("validates Tailwind + PostCSS + root layout entrypoints", () => {
    const globals = readSource(PRIORITY_0_BUILD_MUST_LIVE_V1.entrypoints.globalCss);
    const layout = readSource(PRIORITY_0_BUILD_MUST_LIVE_V1.entrypoints.rootLayout);
    const postcss = readSource(PRIORITY_0_BUILD_MUST_LIVE_V1.entrypoints.postcss);
    expect(globals).toContain('@import "tailwindcss"');
    expect(layout).toContain("@/styles/rovexo/index.css");
    expect(layout).toContain("./globals.css");
    expect(postcss).toContain("@tailwindcss/postcss");
    expect(existsSync(join(process.cwd(), PRIORITY_0_BUILD_MUST_LIVE_V1.entrypoints.tokens))).toBe(
      true,
    );
  });

  it("wires into Priority 0 parent and always-apply rule", () => {
    expect(PRIORITY_0_V1.childLaws).toMatchObject({
      buildMustLive: "lib/priority-0-build-must-live-v1.ts",
    });
    const rule = readSource(".cursor/rules/priority-0-build-must-live-v1.mdc");
    const doc = readSource("docs/engineering/PRIORITY_0_BUILD_MUST_LIVE_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("BUILD MUST LIVE");
    expect(doc).toContain("styles/rovexo/index.css");
  });
});
