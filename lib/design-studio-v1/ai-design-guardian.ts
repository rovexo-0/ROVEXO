import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { SCAN_DIRS, walkFiles } from "@/lib/design-studio-v1/scan-utils";
import type { GuardianFinding, GuardianReport } from "@/lib/design-studio-v1/types";

type ScanOptions = { rootDir?: string };

const GUARDIAN_CHECKS: Array<{
  id: string;
  pattern: RegExp;
  category: GuardianFinding["category"];
  message: string;
  fix: string;
}> = [
  {
    id: "hardcoded-hex",
    pattern: /#[0-9a-fA-F]{3,8}\b/,
    category: "wrong-colors",
    message: "Hardcoded hex color — use design tokens",
    fix: "Replace with var(--ds-color-*) token",
  },
  {
    id: "arbitrary-spacing",
    pattern: /(?:padding|margin|gap):\s*\d+px/,
    category: "wrong-spacing",
    message: "Arbitrary pixel spacing — use spacing tokens",
    fix: "Replace with var(--ds-space-*) token",
  },
  {
    id: "legacy-icon",
    pattern: /Fluency3DIcon|CategoryIcon3D|HomeCategoryIcon3D/,
    category: "mixed-icon-styles",
    message: "Legacy icon component detected",
    fix: "Migrate to RovexoIcon from Asset Library",
  },
  {
    id: "icon-background",
    pattern: /(?:icon|__icon)[^{]*\{[^}]*background:\s*(?!transparent)/,
    category: "mixed-icon-styles",
    message: "Decorative icon background detected",
    fix: "Apply icon-standard-v1.css — background: transparent",
  },
  {
    id: "missing-alt-decorator",
    pattern: /<Image[^>]+(?!alt=)[^/]*\/>/,
    category: "accessibility",
    message: "Image may be missing alt attribute",
    fix: "Add alt text or aria-hidden for decorative images",
  },
];

function scanFile(rootDir: string, filePath: string): GuardianFinding[] {
  const findings: GuardianFinding[] = [];
  const rel = relative(rootDir, filePath).replace(/\\/g, "/");
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (const check of GUARDIAN_CHECKS) {
    lines.forEach((line, index) => {
      if (check.pattern.test(line)) {
        findings.push({
          id: `${check.id}-${rel}-${index + 1}`,
          severity: check.category === "accessibility" ? "warning" : "info",
          category: check.category,
          message: check.message,
          file: rel,
          line: index + 1,
          recommendedFix: check.fix,
          autoFixAvailable: check.id === "legacy-icon" || check.id === "icon-background",
        });
      }
    });
  }

  return findings;
}

export function runAiDesignGuardian(options: ScanOptions = {}): GuardianReport {
  const rootDir = options.rootDir ?? process.cwd();
  const scannedAt = new Date().toISOString();
  const files = SCAN_DIRS.flatMap((dir) =>
    walkFiles(join(rootDir, dir)).filter((f) => f.endsWith(".tsx") || f.endsWith(".css")),
  );

  const findings = files.flatMap((file) => scanFile(rootDir, file)).slice(0, 80);
  const autoFixCount = findings.filter((f) => f.autoFixAvailable).length;

  return {
    scannedAt,
    findings,
    autoFixCount,
    pass: findings.filter((f) => f.severity === "critical").length === 0,
  };
}

export function getGuardianRecommendations(report: GuardianReport): string[] {
  const categories = new Set(report.findings.map((f) => f.category));
  const recommendations: string[] = [];
  if (categories.has("wrong-colors")) recommendations.push("Migrate hardcoded colors to Design Token Manager");
  if (categories.has("wrong-spacing")) recommendations.push("Replace arbitrary spacing with --ds-space-* tokens");
  if (categories.has("mixed-icon-styles")) recommendations.push("Run Global Replace Engine for legacy icons");
  if (categories.has("accessibility")) recommendations.push("Review image alt attributes for WCAG compliance");
  if (recommendations.length === 0) recommendations.push("Platform passes AI Design Guardian checks");
  return recommendations;
}
