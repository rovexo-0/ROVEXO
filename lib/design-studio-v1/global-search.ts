import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { SCAN_DIRS, walkFiles, walkPublicAssets } from "@/lib/design-studio-v1/scan-utils";
import type { GlobalSearchResult } from "@/lib/design-studio-v1/types";

type SearchOptions = { rootDir?: string; query?: string; limit?: number };

const SURFACE_LABELS: Record<string, string> = {
  app: "Pages",
  components: "Components",
  features: "Features",
  styles: "Styles",
};

function classifySurface(filePath: string): string {
  if (filePath.includes("/super-admin")) return "Admin Pages";
  if (filePath.includes("/account")) return "Dashboards";
  if (filePath.includes("/sell")) return "Seller Dashboard";
  if (filePath.includes("mobile")) return "Mobile Screens";
  if (filePath.includes("email") || filePath.includes("notification")) return "Notifications";
  if (filePath.includes("landing")) return "Landing Pages";
  if (filePath.startsWith("components/")) return "Components";
  return "Platform";
}

export function searchVisualAssets(options: SearchOptions = {}): GlobalSearchResult[] {
  const rootDir = options.rootDir ?? process.cwd();
  const query = (options.query ?? "logo").toLowerCase().trim();
  const limit = options.limit ?? 30;
  const results: GlobalSearchResult[] = [];
  const publicDir = join(rootDir, "public");

  for (const filePath of walkPublicAssets(publicDir)) {
    const rel = `/${relative(join(rootDir, "public"), filePath).replace(/\\/g, "/")}`;
    if (!rel.toLowerCase().includes(query)) continue;
    results.push({
      assetPath: rel,
      assetType: rel.includes("icon") ? "icon" : rel.includes("logo") ? "logo" : "asset",
      surfaces: [],
      usageCount: 0,
      dependencyCount: 0,
    });
  }

  for (const dir of SCAN_DIRS) {
    for (const filePath of walkFiles(join(rootDir, dir))) {
      const content = readFileSync(filePath, "utf8");
      if (!content.toLowerCase().includes(query)) continue;
      const rel = relative(rootDir, filePath).replace(/\\/g, "/");
      const matches = (content.match(new RegExp(query, "gi")) ?? []).length;
      results.push({
        assetPath: query,
        assetType: "reference",
        surfaces: [classifySurface(rel), SURFACE_LABELS[dir] ?? dir],
        usageCount: matches,
        dependencyCount: 1,
        file: rel,
      });
    }
  }

  const merged = new Map<string, GlobalSearchResult>();
  for (const result of results) {
    const key = result.file ?? result.assetPath;
    const existing = merged.get(key);
    if (existing) {
      existing.usageCount += result.usageCount;
      existing.surfaces = [...new Set([...existing.surfaces, ...result.surfaces])];
      existing.dependencyCount += result.dependencyCount;
    } else {
      merged.set(key, { ...result, surfaces: [...result.surfaces] });
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}
