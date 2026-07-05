import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { RovexoIcons, getRovexoIconPath } from "@/lib/icons/icons";
import {
  DECORATIVE_ICON_CSS_SELECTORS,
  LEGACY_ICON_IMPORTS,
} from "@/lib/design-studio-v1/icon-standard";
import { SCAN_DIRS, walkFiles } from "@/lib/design-studio-v1/scan-utils";
import type { IconScanFinding, IconScanSummary } from "@/lib/design-studio-v1/types";

type ScanOptions = {
  rootDir?: string;
};

function countPublicIcons(iconsDir: string): number {
  if (!existsSync(iconsDir)) return 0;
  let count = 0;
  const stack = [iconsDir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current)) {
      const fullPath = join(current, entry);
      if (statSync(fullPath).isDirectory()) {
        stack.push(fullPath);
      } else if (entry.endsWith(".svg")) {
        count += 1;
      }
    }
  }
  return count;
}

function collectRegisteredIcons(): Array<{ key: string; path: string }> {
  const entries: Array<{ key: string; path: string }> = [];
  for (const [group, icons] of Object.entries(RovexoIcons)) {
    for (const [name, ref] of Object.entries(icons)) {
      entries.push({
        key: `${group}.${name}`,
        path: getRovexoIconPath(ref),
      });
    }
  }
  return entries;
}

function scanMissingAssets(rootDir: string): IconScanFinding[] {
  const publicDir = join(rootDir, "public");
  const findings: IconScanFinding[] = [];

  for (const entry of collectRegisteredIcons()) {
    const diskPath = join(publicDir, entry.path.replace(/^\//, ""));
    if (!existsSync(diskPath)) {
      findings.push({
        id: `missing-${entry.key}`,
        severity: "critical",
        category: "missing-asset",
        message: `Registered icon missing from Asset Library: ${entry.path}`,
        file: entry.path,
        replacement: entry.path,
      });
    }
  }

  return findings;
}

function scanLegacyImports(rootDir: string): IconScanFinding[] {
  const findings: IconScanFinding[] = [];
  const files = SCAN_DIRS.flatMap((dir) => walkFiles(join(rootDir, dir)));

  for (const filePath of files) {
    if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) continue;
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    for (const legacyImport of LEGACY_ICON_IMPORTS) {
      lines.forEach((line, index) => {
        if (line.includes(legacyImport)) {
          findings.push({
            id: `legacy-${legacyImport}-${relative(rootDir, filePath)}-${index + 1}`,
            severity: "warning",
            category: "legacy-import",
            message: `Legacy icon component "${legacyImport}" — migrate to RovexoIcon via Design Studio Asset Library`,
            file: relative(rootDir, filePath),
            line: index + 1,
            replacement: "RovexoIcon",
          });
        }
      });
    }
  }

  return findings;
}

function scanDecorativeCss(rootDir: string): IconScanFinding[] {
  const findings: IconScanFinding[] = [];
  const stylesDir = join(rootDir, "styles");
  const files = walkFiles(stylesDir).filter((file) => file.endsWith(".css"));

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    const relPath = relative(rootDir, filePath);

    for (const selector of DECORATIVE_ICON_CSS_SELECTORS) {
      if (!content.includes(selector)) continue;
      const blockMatch = content.match(new RegExp(`${selector.replace(/\./g, "\\.")}\\s*\\{[^}]+\\}`, "s"));
      if (!blockMatch) continue;

      const block = blockMatch[0];
      const hasDecorativeBackground =
        /background\s*:\s*(?!transparent)/i.test(block) &&
        !/background\s*:\s*transparent/i.test(block);
      const hasDecorativeBorder = /border\s*:\s*(?!none)/i.test(block) && !/border\s*:\s*none/i.test(block);
      const hasDecorativeShadow = /box-shadow\s*:/i.test(block) && !/box-shadow\s*:\s*none/i.test(block);

      if (hasDecorativeBackground || hasDecorativeBorder || hasDecorativeShadow) {
        findings.push({
          id: `css-${selector}-${relPath}`,
          severity: "warning",
          category: "decorative-container",
          message: `Decorative icon container "${selector}" violates Global Icon Standard`,
          file: relPath,
          replacement: "icon-standard-v1.css",
        });
      }
    }
  }

  return findings;
}

function computeIconScanScore(findings: IconScanFinding[], registeredIcons: number): number {
  if (registeredIcons === 0) return 0;
  const critical = findings.filter((f) => f.severity === "critical").length;
  const warning = findings.filter((f) => f.severity === "warning").length;
  const criticalPenalty = Math.min(100, critical * 20);
  const warningPenalty = Math.min(35, warning);
  return Math.max(0, Math.min(100, Math.round(100 - criticalPenalty - warningPenalty)));
}

export function scanDesignStudioIcons(options: ScanOptions = {}): IconScanSummary {
  const rootDir = options.rootDir ?? process.cwd();
  const scannedAt = new Date().toISOString();
  const totalAssets = countPublicIcons(join(rootDir, "public", "icons"));
  const registeredIcons = collectRegisteredIcons().length;

  const findings = [
    ...scanMissingAssets(rootDir),
    ...scanLegacyImports(rootDir),
    ...scanDecorativeCss(rootDir),
  ];

  const score = computeIconScanScore(findings, registeredIcons);
  const pass = findings.filter((f) => f.severity === "critical").length === 0;

  return {
    scannedAt,
    totalAssets,
    registeredIcons,
    findings,
    pass,
    score,
  };
}

export function getIconScanFindingCounts(summary: IconScanSummary) {
  return {
    critical: summary.findings.filter((f) => f.severity === "critical").length,
    warning: summary.findings.filter((f) => f.severity === "warning").length,
    info: summary.findings.filter((f) => f.severity === "info").length,
  };
}
