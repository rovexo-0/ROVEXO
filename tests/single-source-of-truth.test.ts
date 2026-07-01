import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN_HOME_NAMES = [
  "PremiumHomePage",
  "HomePageV1",
  "HomePage2026",
  "HomepagePremium",
  "HomepageExperimental",
  "MarketplaceHomepage",
  "HomeScreen",
  "LandingHome",
  "OldHomepage",
  "LegacyHomepage",
];

const FORBIDDEN_CSS = [
  "premium-2026.css",
  "homepage-v2.css",
  "premium-home.css",
  "legacy-home.css",
  "home-final.css",
  "home-new.css",
];

const ALLOWLIST = new Set([
  "scripts/migrate-single-source-of-truth.mjs",
  "tests/single-source-of-truth.test.ts",
  "tests/ux-architecture.test.ts",
  "archive",
]);

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "archive" || entry === "ROVEXO") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if ([".tsx", ".ts", ".css"].includes(extname(entry))) files.push(full);
  }
  return files;
}

function rel(file: string): string {
  return file.replace(process.cwd() + "\\", "").replace(process.cwd() + "/", "");
}

describe("ROVEXO Single Source of Truth", () => {
  it("has exactly one official homepage at components/home/RovexoHomePage.tsx", () => {
    expect(existsSync(join(process.cwd(), "components/home/RovexoHomePage.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "components/premium/RovexoHomePage.tsx"))).toBe(false);
  });

  it("routes app/page.tsx through RovexoHomePage only", () => {
    const page = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    expect(page).toContain("RovexoHomePage");
    expect(page).toContain("@/components/home/RovexoHomePage");
    expect(page).not.toContain("PremiumHomePage");
    expect(page).not.toContain("HomeContent");
    for (const forbidden of FORBIDDEN_HOME_NAMES) {
      expect(page).not.toContain(forbidden);
    }
  });

  it("uses the single homepage stylesheet", () => {
    const page = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    const homePage = readFileSync(join(process.cwd(), "components/home/RovexoHomePage.tsx"), "utf8");
    expect(existsSync(join(process.cwd(), "styles/rovexo-homepage.css"))).toBe(true);
    expect(page).toContain("rovexo-homepage.css");
    expect(homePage).toContain("rovexo-homepage.css");
    expect(page).not.toContain("premium-2026");
  });

  it("does not import forbidden legacy homepage names from production code", () => {
    const roots = ["app", "components", "features"];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of walk(join(process.cwd(), root))) {
        const path = rel(file);
        if (path.startsWith("archive/")) continue;
        const content = readFileSync(file, "utf8");
        for (const name of FORBIDDEN_HOME_NAMES) {
          if (content.includes(name)) offenders.push(`${path} → ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("does not reference duplicate homepage CSS in production code", () => {
    const roots = ["app", "components", "features"];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of walk(join(process.cwd(), root))) {
        const path = rel(file);
        if (ALLOWLIST.has(path.split("/")[0] ?? "")) continue;
        const content = readFileSync(file, "utf8");
        for (const css of FORBIDDEN_CSS) {
          if (content.includes(css)) offenders.push(`${path} → ${css}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("exposes the official glass icon system with theme flag", () => {
    const icons = readFileSync(join(process.cwd(), "lib/icons/theme.ts"), "utf8");
    const renderer = readFileSync(join(process.cwd(), "components/icons/RovexoIcon.tsx"), "utf8");
    expect(icons).toContain('mode: "glass"');
    expect(renderer).toContain("RovexoIcon");
    expect(renderer).toContain("isGlassIconMode");
  });

  it("has no lucide-react UI icon imports in app/components/features", () => {
    const offenders: string[] = [];
    for (const root of ["app", "components", "features"]) {
      for (const file of walk(join(process.cwd(), root))) {
        const content = readFileSync(file, "utf8");
        if (content.includes("lucide-react")) offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
