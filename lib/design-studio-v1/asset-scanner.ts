import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { SCAN_DIRS, walkFiles, walkPublicAssets } from "@/lib/design-studio-v1/scan-utils";
import type { AssetScanFinding, AssetScanSummary } from "@/lib/design-studio-v1/types";

type ScanOptions = { rootDir?: string };

const PUBLIC_REF_PATTERN = /["'`]\/([^"'`]+?\.(?:svg|png|webp|avif|jpg|jpeg|gif))["'`]/gi;

function scanBrokenReferences(rootDir: string): AssetScanFinding[] {
  const findings: AssetScanFinding[] = [];
  const publicDir = join(rootDir, "public");
  const files = SCAN_DIRS.flatMap((dir) => walkFiles(join(rootDir, dir)));

  for (const filePath of files) {
    if (filePath.endsWith(".css")) continue;
    const content = readFileSync(filePath, "utf8");
    const rel = relative(rootDir, filePath).replace(/\\/g, "/");
    let match: RegExpExecArray | null;
    PUBLIC_REF_PATTERN.lastIndex = 0;

    while ((match = PUBLIC_REF_PATTERN.exec(content)) !== null) {
      const assetPath = `/${match[1]}`;
      const diskPath = join(publicDir, match[1].replace(/^\//, ""));
      if (!existsSync(diskPath)) {
        findings.push({
          id: `broken-${rel}-${match.index}`,
          severity: "critical",
          category: "broken-reference",
          message: `Broken public asset reference: ${assetPath}`,
          file: rel,
          line: content.slice(0, match.index).split("\n").length,
        });
      }
    }
  }

  return findings;
}

function scanUnusedAssets(rootDir: string, referenced: Set<string>): AssetScanFinding[] {
  const findings: AssetScanFinding[] = [];
  const publicDir = join(rootDir, "public");

  for (const filePath of walkPublicAssets(publicDir)) {
    const rel = `/${relative(join(rootDir, "public"), filePath).replace(/\\/g, "/")}`;
    if (!referenced.has(rel) && !rel.includes("/icons/")) {
      findings.push({
        id: `unused-${rel}`,
        severity: "info",
        category: "unused-asset",
        message: `Potentially unused asset: ${rel}`,
        file: rel,
      });
    }
  }

  return findings.slice(0, 50);
}

function collectReferencedAssets(rootDir: string): Set<string> {
  const referenced = new Set<string>();
  const files = SCAN_DIRS.flatMap((dir) => walkFiles(join(rootDir, dir)));

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    let match: RegExpExecArray | null;
    PUBLIC_REF_PATTERN.lastIndex = 0;
    while ((match = PUBLIC_REF_PATTERN.exec(content)) !== null) {
      referenced.add(`/${match[1]}`);
    }
  }

  return referenced;
}

export function scanBrokenAssets(options: ScanOptions = {}): AssetScanSummary {
  const rootDir = options.rootDir ?? process.cwd();
  const scannedAt = new Date().toISOString();
  const publicDir = join(rootDir, "public");
  const totalFiles = existsSync(publicDir) ? walkPublicAssets(publicDir).length : 0;
  const referenced = collectReferencedAssets(rootDir);

  const findings = [...scanBrokenReferences(rootDir), ...scanUnusedAssets(rootDir, referenced)];
  const brokenReferences = findings.filter((f) => f.category === "broken-reference").length;

  return {
    scannedAt,
    totalFiles,
    brokenReferences,
    unusedAssets: findings.filter((f) => f.category === "unused-asset").length,
    findings,
    pass: brokenReferences === 0,
  };
}
