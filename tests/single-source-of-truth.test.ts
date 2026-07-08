import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN_HOME_NAMES = [
  "PremiumHomePage",
  "HomePageV1",
  "HomepagePremium",
  "MarketplaceHomepage",
  "LegacyHomepage",
];

describe("ROVEXO Single Source of Truth", () => {
  it("has exactly one official homepage at components/homepage/canonical/CanonicalHomepage.tsx", () => {
    expect(existsSync(join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.tsx"))).toBe(true);
  });

  it("routes app/page.tsx through CanonicalHomepage only", () => {
    const page = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    expect(page).toContain("CanonicalHomepage");
    expect(page).toContain("@/components/homepage/canonical");
    expect(page).toContain("homepage-canonical.css");
    expect(page).not.toContain("homepage-v4.css");
    expect(page).not.toContain("HomepageV3");
  });

  it("does not import forbidden legacy homepage names from production code", () => {
    const roots = ["app", "components", "features"];
    const offenders: string[] = [];

    function walk(dir: string, files: string[] = []): string[] {
      if (!existsSync(dir)) return files;
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".next" || entry === "archive") continue;
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) walk(full, files);
        else if ([".tsx", ".ts"].includes(extname(entry))) files.push(full);
      }
      return files;
    }

    for (const root of roots) {
      for (const file of walk(join(process.cwd(), root))) {
        const rel = file.replace(process.cwd() + "\\", "").replace(process.cwd() + "/", "");
        if (rel.startsWith("archive/") || rel.includes("homepage-v3")) continue;
        const content = readFileSync(file, "utf8");
        for (const name of FORBIDDEN_HOME_NAMES) {
          if (content.includes(name)) offenders.push(`${rel} → ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
