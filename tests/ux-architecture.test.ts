import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { describe, expect, it } from "vitest";

const LEGACY_PATTERNS = [
  /premium-2026\.css/,
  /locked-2026\.css/,
  /dashboard-v1\.css/,
  /marketplace-listing-card/,
  /dash-v1-/,
  /enterprise-hub-/,
  /hero-banner-2026/,
  /category-tile-2026/,
  /home-category-premium/,
  /premium-page(?!lace)/,
  /premium-btn/,
  /premium-input/,
  /premium-card/,
];

const ALLOWLIST = new Set([
  "scripts/migrate-ui-architecture.mjs",
  "scripts/migrate-single-source-of-truth.mjs",
  "tests/ux-architecture.test.ts",
  "tests/single-source-of-truth.test.ts",
]);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if ([".tsx", ".ts", ".css"].includes(extname(entry))) files.push(full);
  }
  return files;
}

describe("ROVEXO UX architecture — zero legacy presentation", () => {
  it("loads design system from a single rovexo entry in layout", () => {
    const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).toContain("@/styles/rovexo/index.css");
    expect(layout).not.toContain("premium-2026");
    expect(layout).not.toContain("locked-2026");
    expect(layout).not.toContain("dashboard-v1");
  });

  it("does not reference deleted legacy CSS files in source", () => {
    const roots = ["components", "features", "app", "tests", "e2e"];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of walk(join(process.cwd(), root))) {
        const rel = file.replace(process.cwd() + "\\", "").replace(process.cwd() + "/", "");
        if (ALLOWLIST.has(rel.replace(/\\/g, "/"))) continue;
        if (rel.replace(/\\/g, "/").startsWith("features/super-admin/")) continue;
        const content = readFileSync(file, "utf8");
        for (const pattern of LEGACY_PATTERNS) {
          if (pattern.test(content)) {
            offenders.push(`${rel} → ${pattern}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("uses canonical component library exports", () => {
    const index = readFileSync(join(process.cwd(), "components/ui/index.ts"), "utf8");
    expect(index).toContain("ListingCard");
    expect(index).toContain("Dialog");
    expect(index).toContain("DashboardCard");
    expect(index).toContain("Avatar");
  });
});
