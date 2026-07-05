import { statSync } from "node:fs";
import { join } from "node:path";
import { walkPublicAssets } from "@/lib/design-studio-v1/scan-utils";
import type { AssetOptimizerRecord, AssetOptimizerSummary } from "@/lib/design-studio-v1/types";

type ScanOptions = { rootDir?: string; limit?: number };

function buildRecommendations(format: string, bytes: number): string[] {
  const recommendations: string[] = [];
  if (format === "png" && bytes > 80_000) recommendations.push("Generate WEBP variant");
  if (format === "svg" && bytes > 30_000) recommendations.push("Optimize SVG paths");
  if (format === "jpg" || format === "jpeg") recommendations.push("Convert to WEBP");
  if (bytes > 200_000) recommendations.push("Generate responsive sizes");
  if (recommendations.length === 0) recommendations.push("Asset meets optimization targets");
  return recommendations;
}

function scoreAsset(format: string, bytes: number): number {
  if (format === "svg" && bytes < 20_000) return 95;
  if (format === "webp" && bytes < 50_000) return 92;
  if (format === "png" && bytes < 80_000) return 85;
  if (bytes < 100_000) return 80;
  if (bytes < 250_000) return 65;
  return 50;
}

export function scanAssetOptimization(options: ScanOptions = {}): AssetOptimizerSummary {
  const rootDir = options.rootDir ?? process.cwd();
  const limit = options.limit ?? 20;
  const publicDir = join(rootDir, "public");
  const scannedAt = new Date().toISOString();

  const records: AssetOptimizerRecord[] = walkPublicAssets(publicDir)
    .slice(0, limit)
    .map((filePath) => {
      const format = filePath.split(".").pop()?.toLowerCase() ?? "unknown";
      const bytes = statSync(filePath).size;
      const rel = filePath.replace(rootDir, "").replace(/\\/g, "/");
      return {
        path: rel.startsWith("/") ? rel : `/${rel}`,
        format,
        bytes,
        optimizationScore: scoreAsset(format, bytes),
        recommendations: buildRecommendations(format, bytes),
      };
    });

  const averageScore =
    records.length === 0 ? 100 : Math.round(records.reduce((sum, r) => sum + r.optimizationScore, 0) / records.length);

  return { scannedAt, averageScore, records };
}
