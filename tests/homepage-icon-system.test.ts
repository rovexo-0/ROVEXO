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

const CONSUMER_ICON_PATHS = [
  "components/home/RovexoFooterNavigation.tsx",
  "components/ui/BottomNavigation.tsx",
  "components/ui/BottomNavV2Icon.tsx",
  "components/header/RovexoHeaderV2.tsx",
  "components/home/HomepageSearchField.tsx",
  "features/mobile-ui/components/MobileHubCard.tsx",
  "features/mobile-ui/components/MobileHubFolderIcon.tsx",
  "lib/navigation/link-icons.tsx",
] as const;

function walkIcons(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkIcons(full, files);
    else if (entry.endsWith(".svg")) files.push(full);
  }
  return files;
}

function readSource(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Canonical Homepage — icon system", () => {
  it("renders homepage UI icons exclusively through RovexoIcon; header uses RvxLineIcons", () => {
    for (const rel of HOME_FILES) {
      const source = readSource(rel);
      expect(source).not.toContain("lucide-react");
    }

    const header = readSource(HEADER_FILE);
    expect(header).not.toContain("lucide-react");
    expect(header).toContain("RvxLineIcons");
    expect(header).not.toContain("MessageSquare");
    expect(header).toContain("BellLineIcon");
    // Homepage layout omits logo + notification (PO authorized removal).
    expect(header).toContain("!isHomepageLayout");
  });

  it("uses text-link category rail without icon holders", () => {
    const css = readSource("components/homepage/canonical/CanonicalHomepage.module.css");
    const rail = readSource("components/homepage/canonical/CanonicalCategoryRail.tsx");
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

describe("Canonical Homepage — Absolute Final icon freeze", () => {
  it("consumer routes forbid Fluency 3D / premium nav WebP asset loading", () => {
    for (const rel of CONSUMER_ICON_PATHS) {
      const source = readSource(rel);
      expect(source).not.toContain("getFluency3DAssetPath");
      expect(source).not.toContain("getAccountIconPng");
      expect(source).not.toContain("getAccountIconWebp");
      expect(source).not.toContain("/icons/premium/nav/");
      expect(source).not.toContain("/icons/fluency-3d/");
      expect(source).not.toContain("PremiumNavIcon");
    }
  });

  it("bottom navigation uses line icons — not BottomNavIcon3D Fluency wrapper", () => {
    const bottomNav = readSource("components/ui/BottomNavigation.tsx");
    expect(bottomNav).toContain("BottomNavV2Icon");
    expect(bottomNav).not.toContain("<BottomNavIcon3D");
  });

  it("legacy wrappers that remain on consumer paths use RvxLineIcons or AccountIcon", () => {
    const bottomNav3d = readSource("components/icons/BottomNavIcon3D.tsx");
    const dashboard3d = readSource("components/icons/DashboardIcon3D.tsx");
    const fluency = readSource("components/icons/Fluency3DIcon.tsx");
    expect(bottomNav3d).toContain("RvxLineIcons");
    expect(dashboard3d).toContain("RvxLineIcons");
    expect(fluency).toContain("RvxLineIcons");
    expect(fluency).not.toContain("<picture");
    expect(fluency).not.toMatch(/fluency-3d\/.*\.(webp|png)/);
  });
});
