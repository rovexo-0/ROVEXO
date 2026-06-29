import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  ROVEXO_CATEGORY_PREMIUM_KEYS,
} from "@/lib/home/category-premium-library";
import {
  HERO_CAMPAIGN_IDS,
  HERO_CAMPAIGN_WIDTHS,
} from "@/lib/home/hero-campaign-library";
import {
  PREMIUM_EMPTY_STATE_IDS,
  PREMIUM_EMPTY_STATE_SIZES,
} from "@/lib/premium-design/empty-state-library";
import {
  PRODUCTION_ASSET_SECTION_LABELS,
  type ProductionAssetSection,
  type ProductionAssetValidationReport,
  type ValidationIssue,
} from "@/lib/super-admin/production-assets/types";

const ROOT = process.cwd();

const ASSET_ROOTS = [
  "public/categories",
  "public/hero",
  "public/banners",
  "public/promotions",
  "public/assets",
  "public/images",
] as const;

const FORBIDDEN_NAME_PATTERN =
  /placeholder|demo|sample|temp|mock|default|old|svg-placeholder|procedural|development|example/i;

const FILENAME_ALLOWLIST = new Set(["blur-placeholders.json", "manifest.json", ".gitignore"]);

const CATEGORY_SIZES = [64, 128, 256, 512, 1024] as const;
const IMAGE_EXTENSIONS = new Set([".avif", ".webp", ".png", ".svg", ".jpg", ".jpeg", ".gif"]);

const MIN_CATEGORY_BYTES = 1024;
const MIN_CATEGORY_RESPONSIVE_BYTES = 512;
const MIN_HERO_BYTES = 4096;
const MIN_CATEGORY_SOURCE_BYTES = 12_000;
const MIN_CATEGORY_3D_SOURCE_BYTES = 8_000;
const MIN_HERO_SOURCE_BYTES = 80_000;

const APPROVED_CATEGORY_PIPELINES = new Set(["source-photography-only", "v16-raster-3d"]);

function minCategoryRailBytes(size: number, ext: "avif" | "webp" | "png"): number {
  if (size === 1024) return MIN_CATEGORY_BYTES;
  if (size === 64) return ext === "png" ? 400 : 150;
  if (size === 128) return ext === "png" ? 700 : 200;
  if (size === 256) return ext === "png" ? 1_500 : 450;
  if (size === 512) return ext === "png" ? 3_000 : 900;
  return MIN_CATEGORY_RESPONSIVE_BYTES;
}

async function readCategoryPipeline(): Promise<string | undefined> {
  const manifestPath = path.join(ROOT, "public/categories/manifest.json");
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { pipeline?: string };
    return manifest.pipeline;
  } catch {
    return undefined;
  }
}

function isApprovedCategoryPipeline(pipeline: string | undefined): boolean {
  return Boolean(pipeline && APPROVED_CATEGORY_PIPELINES.has(pipeline));
}

const SECTION_LABELS = PRODUCTION_ASSET_SECTION_LABELS;

const STATIC_SECTION_DIRS: Partial<Record<ProductionAssetSection, string>> = {
  banners: "public/banners",
  promotions: "public/promotions",
  "empty-states": "public/assets",
  "feature-cards": "public/assets",
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function relativePublicPath(absolutePath: string): string {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}

function pushIssue(
  issues: ValidationIssue[],
  issue: Omit<ValidationIssue, "severity"> & { severity?: ValidationIssue["severity"] },
): void {
  issues.push({ severity: issue.severity ?? "error", ...issue });
}

function parseHeroAssetId(filename: string): string | null {
  const base = path.basename(filename, path.extname(filename));
  const match = base.match(/^(.+?)(?:-(768|1280|1920|3840))?$/);
  return match?.[1] ?? null;
}

async function walkFiles(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function scanDirectoryForIssues(
  dirRelative: string,
  section: ProductionAssetSection,
  issues: ValidationIssue[],
  options: {
    rejectSvg?: boolean;
    skipSubdirs?: string[];
  } = {},
): Promise<{ files: string[]; counts: { avif: number; webp: number; png: number; svg: number } }> {
  const dir = path.join(ROOT, dirRelative);
  const counts = { avif: 0, webp: 0, png: 0, svg: 0 };
  if (!(await exists(dir))) return { files: [], counts };

  const allFiles = await walkFiles(dir);
  const files: string[] = [];

  for (const filePath of allFiles) {
    const rel = relativePublicPath(filePath);
    const basename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (FILENAME_ALLOWLIST.has(basename)) continue;

    const withinSkippedSubdir = options.skipSubdirs?.some((sub) =>
      rel.includes(`/${sub}/`),
    );
    if (withinSkippedSubdir) continue;

    if (!IMAGE_EXTENSIONS.has(ext) && ext !== ".json") continue;

    files.push(filePath);

    if (ext === ".avif") counts.avif += 1;
    if (ext === ".webp") counts.webp += 1;
    if (ext === ".png") counts.png += 1;
    if (ext === ".svg") counts.svg += 1;

    if (FORBIDDEN_NAME_PATTERN.test(basename)) {
      pushIssue(issues, {
        code: "placeholder-filename",
        path: rel,
        message: `Forbidden placeholder filename: ${basename}`,
        section,
      });
    }

    if (options.rejectSvg && ext === ".svg") {
      pushIssue(issues, {
        code: "forbidden-svg",
        path: rel,
        message: "SVG assets are not permitted in premium production folders",
        section,
      });
    }
  }

  return { files, counts };
}

async function validateCategoryRail(issues: ValidationIssue[]): Promise<number> {
  let count = 0;
  const categoryRoot = path.join(ROOT, "public/categories");

  for (const icon of ROVEXO_CATEGORY_PREMIUM_KEYS) {
    for (const size of CATEGORY_SIZES) {
      for (const ext of ["avif", "webp", "png"] as const) {
        const filename = size === 1024 ? `${icon}.${ext}` : `${icon}-${size}.${ext}`;
        const assetPath = path.join(categoryRoot, filename);
        const rel = relativePublicPath(assetPath);

        if (!(await exists(assetPath))) {
          pushIssue(issues, {
            code: "missing-asset",
            path: rel,
            message: `Missing category rail asset: ${filename}`,
            section: "category-rail",
          });
          continue;
        }

        count += 1;
        const { size: bytes } = await stat(assetPath);
        const minBytes = minCategoryRailBytes(size, ext);
        if (bytes < minBytes) {
          pushIssue(issues, {
            code: "undersized-asset",
            path: rel,
            message: `Undersized category asset (${bytes} bytes) — likely procedural placeholder`,
            section: "category-rail",
          });
        }
      }
    }
  }

  const manifestPath = path.join(categoryRoot, "manifest.json");
  if (!(await exists(manifestPath))) {
    pushIssue(issues, {
      code: "missing-asset",
      path: relativePublicPath(manifestPath),
      message: "Missing public/categories/manifest.json",
      section: "homepage-categories",
    });
  } else {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      pipeline?: string;
      formats?: string[];
    };
    if (!isApprovedCategoryPipeline(manifest.pipeline)) {
      pushIssue(issues, {
        code: "broken-manifest",
        path: relativePublicPath(manifestPath),
        message: "Category manifest must declare an approved pipeline (source-photography-only or v16-raster-3d)",
        section: "homepage-categories",
      });
    }
    if (!manifest.formats?.includes("avif")) {
      pushIssue(issues, {
        code: "broken-manifest",
        path: relativePublicPath(manifestPath),
        message: "Category manifest must include avif format",
        section: "homepage-categories",
      });
    }
  }

  return count;
}

async function validateHeroCampaigns(issues: ValidationIssue[]): Promise<number> {
  let count = 0;
  const heroRoot = path.join(ROOT, "public/hero");
  const activeIds = new Set<string>(HERO_CAMPAIGN_IDS);

  for (const id of HERO_CAMPAIGN_IDS) {
    for (const width of HERO_CAMPAIGN_WIDTHS) {
      for (const ext of ["avif", "webp", "png"] as const) {
        const filename = width === 1920 ? `${id}.${ext}` : `${id}-${width}.${ext}`;
        const assetPath = path.join(heroRoot, filename);
        const rel = relativePublicPath(assetPath);

        if (!(await exists(assetPath))) {
          pushIssue(issues, {
            code: "missing-asset",
            path: rel,
            message: `Missing hero campaign asset: ${filename}`,
            section: "hero-campaigns",
          });
          continue;
        }

        count += 1;
        const { size: bytes } = await stat(assetPath);
        if (bytes < MIN_HERO_BYTES) {
          pushIssue(issues, {
            code: "undersized-asset",
            path: rel,
            message: `Undersized hero asset (${bytes} bytes) — likely procedural placeholder`,
            section: "hero-campaigns",
          });
        }
      }
    }
  }

  const heroFiles = await walkFiles(heroRoot);
  for (const filePath of heroFiles) {
    const rel = relativePublicPath(filePath);
    if (rel.includes("/source/")) continue;

    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const basename = path.basename(filePath);
    if (FILENAME_ALLOWLIST.has(basename)) continue;

    const campaignId = parseHeroAssetId(basename);
    if (campaignId && !activeIds.has(campaignId)) {
      pushIssue(issues, {
        code: "stale-asset",
        path: rel,
        message: `Stale hero asset not in active campaign library: ${basename}`,
        section: "hero-campaigns",
      });
    }
  }

  const manifestPath = path.join(heroRoot, "manifest.json");
  if (!(await exists(manifestPath))) {
    pushIssue(issues, {
      code: "missing-asset",
      path: relativePublicPath(manifestPath),
      message: "Missing public/hero/manifest.json",
      section: "hero-campaigns",
    });
  } else {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { pipeline?: string };
    if (manifest.pipeline !== "source-photography-only") {
      pushIssue(issues, {
        code: "broken-manifest",
        path: relativePublicPath(manifestPath),
        message: "Hero manifest must declare pipeline: source-photography-only",
        section: "hero-campaigns",
      });
    }
  }

  return count;
}

async function validateSourceMasters(issues: ValidationIssue[]): Promise<number> {
  let count = 0;
  const categorySource = path.join(ROOT, "public/categories/source");
  const heroSource = path.join(ROOT, "public/hero/source");
  const categoryPipeline = await readCategoryPipeline();
  const category3dPack = categoryPipeline === "v16-raster-3d";
  const minCategorySourceBytes = category3dPack ? MIN_CATEGORY_3D_SOURCE_BYTES : MIN_CATEGORY_SOURCE_BYTES;

  for (const icon of ROVEXO_CATEGORY_PREMIUM_KEYS) {
    const filePath = path.join(categorySource, `${icon}.png`);
    const rel = relativePublicPath(filePath);
    if (!(await exists(filePath))) {
      pushIssue(issues, {
        code: "missing-asset",
        path: rel,
        message: `Missing category photography source: ${icon}.png`,
        section: "sources",
      });
      continue;
    }
    count += 1;
    const { size } = await stat(filePath);
    if (size < minCategorySourceBytes) {
      pushIssue(issues, {
        code: "undersized-asset",
        path: rel,
        message: category3dPack
          ? `Category 3D source too small (${size} bytes) — not approved premium render`
          : `Category source too small (${size} bytes) — not approved premium photography`,
        section: "sources",
      });
    }
  }

  for (const id of HERO_CAMPAIGN_IDS) {
    const filePath = path.join(heroSource, `${id}.png`);
    const rel = relativePublicPath(filePath);
    if (!(await exists(filePath))) {
      pushIssue(issues, {
        code: "missing-asset",
        path: rel,
        message: `Missing hero photography source: ${id}.png`,
        section: "sources",
      });
      continue;
    }
    count += 1;
    const { size } = await stat(filePath);
    if (size < MIN_HERO_SOURCE_BYTES) {
      pushIssue(issues, {
        code: "undersized-asset",
        path: rel,
        message: `Hero source too small (${size} bytes) — not approved premium photography`,
        section: "sources",
      });
    }
  }

  const categorySourceManifest = path.join(categorySource, "manifest.json");
  if (!(await exists(categorySourceManifest))) {
    pushIssue(issues, {
      code: "missing-asset",
      path: relativePublicPath(categorySourceManifest),
      message: "Missing source manifest.json",
      section: "sources",
    });
  } else {
    const manifest = JSON.parse(await readFile(categorySourceManifest, "utf8")) as { pipeline?: string };
    if (!isApprovedCategoryPipeline(manifest.pipeline)) {
      pushIssue(issues, {
        code: "broken-manifest",
        path: relativePublicPath(categorySourceManifest),
        message: "Category source manifest must declare an approved pipeline (source-photography-only or v16-raster-3d)",
        section: "sources",
      });
    }
  }

  const heroSourceManifest = path.join(heroSource, "manifest.json");
  if (!(await exists(heroSourceManifest))) {
    pushIssue(issues, {
      code: "missing-asset",
      path: relativePublicPath(heroSourceManifest),
      message: "Missing source manifest.json",
      section: "sources",
    });
  } else {
    const manifest = JSON.parse(await readFile(heroSourceManifest, "utf8")) as { pipeline?: string };
    if (manifest.pipeline !== "source-photography-only") {
      pushIssue(issues, {
        code: "broken-manifest",
        path: relativePublicPath(heroSourceManifest),
        message: "Hero source manifest must declare pipeline: source-photography-only",
        section: "sources",
      });
    }
  }

  return count;
}

async function validateRuntimeReferences(issues: ValidationIssue[]): Promise<void> {
  const constantsPath = path.join(ROOT, "lib/home/constants.ts");
  const heroImagesPath = path.join(ROOT, "lib/home/hero-images.ts");

  if (await exists(constantsPath)) {
    const contents = await readFile(constantsPath, "utf8");
    if (contents.includes("unsplash.com")) {
      pushIssue(issues, {
        code: "external-url-reference",
        path: "lib/home/constants.ts",
        message: "Homepage constants still reference unsplash.com",
        section: "hero-campaigns",
      });
    }
  }

  if (await exists(heroImagesPath)) {
    const contents = await readFile(heroImagesPath, "utf8");
    if (contents.includes("unsplash.com")) {
      pushIssue(issues, {
        code: "external-url-reference",
        path: "lib/home/hero-images.ts",
        message: "Hero image helpers still reference unsplash.com",
        section: "hero-campaigns",
      });
    }
  }
}

async function validateResponsiveCategoryAssets(): Promise<boolean> {
  for (const icon of ROVEXO_CATEGORY_PREMIUM_KEYS) {
    for (const size of CATEGORY_SIZES) {
      for (const ext of ["avif", "webp", "png"] as const) {
        const filename = size === 1024 ? `${icon}.${ext}` : `${icon}-${size}.${ext}`;
        if (!(await exists(path.join(ROOT, "public/categories", filename)))) return false;
      }
    }
  }
  return true;
}

async function validateResponsiveHeroAssets(): Promise<boolean> {
  for (const id of HERO_CAMPAIGN_IDS) {
    for (const width of HERO_CAMPAIGN_WIDTHS) {
      for (const ext of ["avif", "webp", "png"] as const) {
        const filename = width === 1920 ? `${id}.${ext}` : `${id}-${width}.${ext}`;
        if (!(await exists(path.join(ROOT, "public/hero", filename)))) return false;
      }
    }
  }
  return true;
}

async function validateEmptyStates(issues: ValidationIssue[]): Promise<number> {
  let count = 0;
  const root = path.join(ROOT, "public/assets/empty-states");

  for (const id of PREMIUM_EMPTY_STATE_IDS) {
    for (const size of PREMIUM_EMPTY_STATE_SIZES) {
      for (const ext of ["avif", "webp", "png"] as const) {
        const filename = size === 960 ? `${id}.${ext}` : `${id}-${size}.${ext}`;
        const assetPath = path.join(root, filename);
        const rel = relativePublicPath(assetPath);
        if (!(await exists(assetPath))) {
          pushIssue(issues, {
            code: "missing-asset",
            path: rel,
            message: `Missing empty-state asset: ${filename}`,
            section: "empty-states",
          });
          continue;
        }
        count += 1;
        const { size: bytes } = await stat(assetPath);
        if (bytes < 512) {
          pushIssue(issues, {
            code: "undersized-asset",
            path: rel,
            message: `Undersized empty-state asset (${bytes} bytes)`,
            section: "empty-states",
          });
        }
      }
    }
  }

  const manifestPath = path.join(root, "manifest.json");
  if (!(await exists(manifestPath))) {
    pushIssue(issues, {
      code: "missing-asset",
      path: relativePublicPath(manifestPath),
      message: "Missing public/assets/empty-states/manifest.json",
      section: "empty-states",
    });
  }

  return count;
}

async function validateLegacyPaths(issues: ValidationIssue[]): Promise<void> {
  const legacyHome = path.join(ROOT, "public/categories/home");
  if (await exists(legacyHome)) {
    pushIssue(issues, {
      code: "legacy-directory",
      path: "public/categories/home/",
      message: "Legacy development category assets directory must be removed before production",
      section: "homepage-categories",
    });
  }
}

function buildSectionStatus(
  section: ProductionAssetSection,
  assetCount: number,
  issues: ValidationIssue[],
): { label: string; status: "passed" | "failed" | "skipped"; assetCount: number } {
  const sectionIssues = issues.filter((issue) => issue.section === section && issue.severity === "error");
  const dynamicSections: ProductionAssetSection[] = [
    "featured-listings",
    "recommended",
    "recently-listed",
    "auctions",
    "business-spotlight",
    "continue-browsing",
  ];

  if (dynamicSections.includes(section)) {
    return {
      label: SECTION_LABELS[section],
      status: "passed",
      assetCount: 0,
    };
  }

  if (STATIC_SECTION_DIRS[section] && assetCount === 0) {
    return {
      label: SECTION_LABELS[section],
      status: "skipped",
      assetCount: 0,
    };
  }

  return {
    label: SECTION_LABELS[section],
    status: sectionIssues.length > 0 ? "failed" : "passed",
    assetCount,
  };
}

export async function validateProductionAssets(): Promise<ProductionAssetValidationReport> {
  const issues: ValidationIssue[] = [];
  const formatTotals = { avif: 0, webp: 0, png: 0, svg: 0 };

  for (const root of ASSET_ROOTS) {
    const { counts } = await scanDirectoryForIssues(root, "homepage-categories", issues, {
      rejectSvg: root === "public/categories" || root === "public/hero",
      skipSubdirs:
        root === "public/categories" || root === "public/hero"
          ? ["source"]
          : root === "public/assets"
            ? ["source"]
            : undefined,
    });
    formatTotals.avif += counts.avif;
    formatTotals.webp += counts.webp;
    formatTotals.png += counts.png;
    formatTotals.svg += counts.svg;
  }

  for (const [section, dir] of Object.entries(STATIC_SECTION_DIRS)) {
    await scanDirectoryForIssues(dir, section as ProductionAssetSection, issues);
  }

  const categoryRailCount = await validateCategoryRail(issues);
  const heroCount = await validateHeroCampaigns(issues);
  const sourceCount = await validateSourceMasters(issues);
  const emptyStateCount = await validateEmptyStates(issues);
  await validateRuntimeReferences(issues);
  await validateLegacyPaths(issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const placeholderAssets = errors.filter((issue) =>
    ["placeholder-filename", "forbidden-svg", "undersized-asset"].includes(issue.code),
  ).length;
  const missingAssets = errors.filter((issue) => issue.code === "missing-asset").length;
  const brokenAssets = errors.filter((issue) =>
    ["broken-manifest", "external-url-reference"].includes(issue.code),
  ).length;
  const staleAssets = errors.filter((issue) =>
    ["stale-asset", "legacy-directory"].includes(issue.code),
  ).length;

  const premiumAssets = categoryRailCount + heroCount + sourceCount + emptyStateCount;
  const totalAssets = formatTotals.avif + formatTotals.webp + formatTotals.png + formatTotals.svg;

  const sections = Object.keys(SECTION_LABELS).reduce(
    (acc, key) => {
      const section = key as ProductionAssetSection;
      let assetCount = 0;
      if (section === "category-rail") assetCount = categoryRailCount;
      if (section === "hero-campaigns") assetCount = heroCount;
      if (section === "sources") assetCount = sourceCount;
      if (section === "empty-states") assetCount = emptyStateCount;
      acc[section] = buildSectionStatus(section, assetCount, issues);
      return acc;
    },
    {} as ProductionAssetValidationReport["sections"],
  );

  const categoryResponsive = await validateResponsiveCategoryAssets();
  const heroResponsive = await validateResponsiveHeroAssets();

  return {
    validatedAt: new Date().toISOString(),
    status: errors.length === 0 ? "passed" : "failed",
    deploymentReady: errors.length === 0,
    summary: {
      totalAssets,
      premiumAssets,
      placeholderAssets,
      missingAssets,
      brokenAssets,
      staleAssets,
    },
    formats: formatTotals,
    responsiveImages: {
      category: categoryResponsive,
      hero: heroResponsive,
    },
    sections,
    issues: errors,
  };
}

export function formatValidationReport(report: ProductionAssetValidationReport): string {
  const lines: string[] = [];

  if (report.deploymentReady) {
    lines.push("✅ Premium assets verified");
    lines.push("✅ Production assets only");
    lines.push("✅ No placeholder graphics");
    lines.push("✅ Homepage approved");
    lines.push("✅ Production deployment allowed");
  } else {
    lines.push("❌ BUILD FAILED");
    lines.push("");
    lines.push("Placeholder assets detected.");
    lines.push("Production deployment blocked.");
    lines.push("");
    lines.push("Replace assets with approved Premium production assets.");
    lines.push("");
    lines.push(`Issues (${report.issues.length}):`);
    for (const issue of report.issues.slice(0, 40)) {
      lines.push(`  - [${issue.code}] ${issue.path}: ${issue.message}`);
    }
    if (report.issues.length > 40) {
      lines.push(`  … and ${report.issues.length - 40} more`);
    }
  }

  return lines.join("\n");
}
