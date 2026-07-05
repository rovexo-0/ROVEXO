import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HOME_FILES = [
  "components/home/RovexoHomePage.tsx",
  "components/home/RovexoCategoryCard.tsx",
  "components/home/RovexoAllListings.tsx",
  "components/ui/ListingCard.tsx",
  "components/Header.tsx",
];

function walkIcons(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkIcons(full, files);
    else if (entry.endsWith(".svg")) files.push(full);
  }
  return files;
}

describe("RovexoHomePage — Premium 3D Glass icon system", () => {
  it("renders homepage UI icons exclusively through RovexoIcon", () => {
    for (const rel of HOME_FILES) {
      const source = readFileSync(join(process.cwd(), rel), "utf8");
      expect(source).not.toContain("lucide-react");
      expect(source).not.toContain("RovexoGlassIcon");
      if (source.includes("Icon")) {
        expect(source.includes("RovexoIcon") || !source.includes("GlassIcon")).toBe(true);
      }
    }
  });

  it("exposes global icon theme with glass default and standard fallback", () => {
    const theme = readFileSync(join(process.cwd(), "lib/icons/theme.ts"), "utf8");
    expect(theme).toContain('mode: "glass"');
    expect(theme).toContain('"standard"');
  });

  it("uses frameless category slots without holder graphics", () => {
    const css = readFileSync(join(process.cwd(), "styles/rovexo-homepage.css"), "utf8");
    expect(css).toContain(".home-v1-category-tile__slot");
    expect(css).toContain("--rx-cat-icon: clamp(60px");
    expect(css).toContain("width: 44px");
    expect(css).not.toContain(".home-v1-category-tile__box");
    expect(css).toContain(".rovexo-icon");
  });

  it("generates SVG icons without baked plate or tile backgrounds", () => {
    const iconsDir = join(process.cwd(), "public/icons");
    expect(existsSync(iconsDir)).toBe(true);
    const svgs = walkIcons(iconsDir);
    expect(svgs.length).toBeGreaterThan(0);

    for (const file of svgs) {
      const svg = readFileSync(file, "utf8");
      expect(svg).not.toContain('id="plate"');
      expect(svg).not.toMatch(/<rect[^>]+fill="url\(#plate\)"/);
    }
  });

  it("maps homepage size tokens to the official scale", () => {
    const sizes = readFileSync(join(process.cwd(), "lib/icons/sizes.ts"), "utf8");
    expect(sizes).toContain("category: 44");
    expect(sizes).toContain("categoryContainer: 60");
    expect(sizes).toContain("header: 24");
    expect(sizes).toContain("bottomNav: 26");
  });
});
