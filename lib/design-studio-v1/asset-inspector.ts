import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { walkPublicAssets } from "@/lib/design-studio-v1/scan-utils";
import type { AssetInspectorRecord } from "@/lib/design-studio-v1/types";
import { SCAN_DIRS, walkFiles } from "@/lib/design-studio-v1/scan-utils";

type InspectOptions = { rootDir?: string; limit?: number };

function countAssetUsage(rootDir: string, assetPath: string): number {
  let count = 0;
  const needle = assetPath.replace(/^\//, "");
  for (const filePath of SCAN_DIRS.flatMap((dir) => walkFiles(join(rootDir, dir)))) {
    const content = readFileSync(filePath, "utf8");
    if (content.includes(assetPath) || content.includes(needle)) count += 1;
  }
  return count;
}

function validateSvg(content: string): boolean {
  return content.includes("<svg") && content.includes("</svg>");
}

function findDependencies(rootDir: string, assetPath: string): string[] {
  const deps: string[] = [];
  const needle = assetPath.replace(/^\//, "");
  for (const filePath of SCAN_DIRS.flatMap((dir) => walkFiles(join(rootDir, dir)))) {
    const content = readFileSync(filePath, "utf8");
    if (content.includes(assetPath) || content.includes(needle)) {
      deps.push(relative(rootDir, filePath).replace(/\\/g, "/"));
    }
  }
  return deps.slice(0, 8);
}

function inspectAsset(rootDir: string, filePath: string): AssetInspectorRecord {
  const rel = `/${relative(join(rootDir, "public"), filePath).replace(/\\/g, "/")}`;
  const stat = statSync(filePath);
  const format = filePath.split(".").pop()?.toLowerCase() ?? "unknown";
  const content = format === "svg" ? readFileSync(filePath, "utf8") : "";
  const svgValid = format !== "svg" || validateSvg(content);
  const transparent = format === "svg" || format === "png" || format === "webp";
  const bytes = stat.size;
  const optimizationScore = bytes < 50_000 ? 92 : bytes < 200_000 ? 78 : 60;
  const usageCount = countAssetUsage(rootDir, rel);
  const dependencies = findDependencies(rootDir, rel);

  return {
    assetId: rel.replace(/[^\w]+/g, "-").replace(/^-|-$/g, ""),
    path: rel,
    version: "2.0.0",
    format,
    bytes,
    resolution: format === "svg" ? "vector" : undefined,
    svgValid,
    transparent,
    optimizationScore,
    accessibilityScore: svgValid ? 90 : 50,
    performanceScore: optimizationScore,
    responsiveScore: bytes < 256_000 ? 92 : 75,
    darkModeCompatible: true,
    lightModeCompatible: true,
    pwaCompatible: bytes < 512_000,
    mobileCompatible: bytes < 256_000,
    desktopCompatible: true,
    usageCount,
    dependencyCount: dependencies.length,
    dependencies,
    status: rel.includes("premium-studio") ? "legacy" : "official",
    author: "ROVEXO Design Studio",
    createdDate: stat.birthtime.toISOString(),
    lastModified: stat.mtime.toISOString(),
  };
}

export function inspectDesignStudioAssets(options: InspectOptions = {}): AssetInspectorRecord[] {
  const rootDir = options.rootDir ?? process.cwd();
  const limit = options.limit ?? 24;
  const publicDir = join(rootDir, "public", "icons");

  return walkPublicAssets(publicDir)
    .filter((file) => file.endsWith(".svg"))
    .slice(0, limit)
    .map((file) => inspectAsset(rootDir, file));
}
