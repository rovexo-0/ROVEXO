import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const SCAN_DIRS = ["components", "features", "app", "styles", "public"] as const;
export const SOURCE_EXTENSIONS = [".tsx", ".ts", ".css", ".mjs"] as const;
export const ASSET_EXTENSIONS = [".svg", ".png", ".webp", ".avif", ".jpg", ".jpeg", ".gif", ".lottie", ".json"] as const;

export function walkFiles(
  dir: string,
  extensions: readonly string[] = SOURCE_EXTENSIONS,
  acc: string[] = [],
): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(fullPath, extensions, acc);
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      acc.push(fullPath);
    }
  }
  return acc;
}

export function walkPublicAssets(publicDir: string): string[] {
  return walkFiles(publicDir, ASSET_EXTENSIONS);
}
