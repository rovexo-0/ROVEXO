import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { walkPublicAssets } from "@/lib/design-studio-v1/scan-utils";
import type { DuplicateScanSummary } from "@/lib/design-studio-v1/types";

type ScanOptions = { rootDir?: string };

export function scanDuplicateAssets(options: ScanOptions = {}): DuplicateScanSummary {
  const rootDir = options.rootDir ?? process.cwd();
  const publicDir = join(rootDir, "public");
  const scannedAt = new Date().toISOString();
  const hashMap = new Map<string, string[]>();

  for (const filePath of walkPublicAssets(publicDir)) {
    const content = readFileSync(filePath);
    const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);
    const rel = relative(rootDir, filePath).replace(/\\/g, "/");
    const existing = hashMap.get(hash) ?? [];
    existing.push(rel);
    hashMap.set(hash, existing);
  }

  const groups = [...hashMap.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([hash, files], index) => ({
      id: `dup-${index + 1}`,
      hash,
      files,
      suggestion: `Merge ${files.length} duplicate assets — keep ${files[0]}`,
    }));

  return {
    scannedAt,
    groups,
    totalDuplicates: groups.reduce((sum, group) => sum + group.files.length - 1, 0),
  };
}
