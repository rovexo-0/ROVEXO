import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HOME_FILES = [
  "components/homepage/canonical/CanonicalHomepage.tsx",
  "components/homepage/canonical/CanonicalCategoryRail.tsx",
  "components/homepage/canonical/CanonicalMarketplaceFeed.tsx",
  "components/Header.tsx",
];

const HEADER_FILE = "components/header/RovexoHeaderV2.tsx";

function walkIcons(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkIcons(full, files);
    else if (entry.endsWith(".svg")) files.push(full);
  }
  return files;
}

describe("Canonical Homepage — icon system", () => {
  it("renders homepage UI icons exclusively through RovexoIcon; header uses RvxLineIcons", () => {
    for (const rel of HOME_FILES) {
      const source = readFileSync(join(process.cwd(), rel), "utf8");
      expect(source).not.toContain("lucide-react");
    }

    const header = readFileSync(join(process.cwd(), HEADER_FILE), "utf8");
    expect(header).not.toContain("lucide-react");
    expect(header).toContain("RvxLineIcons");
    expect(header).not.toContain("MessageSquare");
    expect(header).toContain("BellLineIcon");
    // Homepage layout omits logo + notification (PO authorized removal).
    expect(header).toContain("!isHomepageLayout");
  });

  it("uses text-link category rail without icon holders", () => {
    const css = readFileSync(join(process.cwd(), "components/homepage/canonical/CanonicalHomepage.module.css"), "utf8");
    const rail = readFileSync(join(process.cwd(), "components/homepage/canonical/CanonicalCategoryRail.tsx"), "utf8");
    expect(css).toContain(".chip");
    expect(rail).not.toContain("<picture");
  });

  it("generates SVG icons without baked plate backgrounds", () => {
    const iconsDir = join(process.cwd(), "public/icons");
    expect(existsSync(iconsDir)).toBe(true);
    const svgs = walkIcons(iconsDir);
    expect(svgs.length).toBeGreaterThan(0);
  });
});
