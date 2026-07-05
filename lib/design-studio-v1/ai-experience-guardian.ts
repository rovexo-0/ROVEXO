import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runAiDesignGuardian } from "@/lib/design-studio-v1/ai-design-guardian";
import { SCAN_DIRS, walkFiles } from "@/lib/design-studio-v1/scan-utils";
import type { ExperienceGuardianFinding, ExperienceGuardianReport } from "@/lib/design-studio-v1/types";

type ScanOptions = { rootDir?: string };

const UX_CHECKS = [
  { id: "duplicate-component", pattern: /export function (\w+)/g, category: "duplicate-components" as const, message: "Potential duplicate component export" },
  { id: "long-nav-chain", pattern: /href=["'][^"']{40,}["']/g, category: "long-navigation" as const, message: "Long navigation URL — simplify user flow" },
  { id: "low-contrast", pattern: /text-gray-400|color:\s*#aaa/i, category: "low-contrast" as const, message: "Potential low contrast text" },
  { id: "fixed-width", pattern: /width:\s*\d{4,}px/i, category: "broken-responsive" as const, message: "Fixed width may break responsive layout" },
];

export function runAiExperienceGuardian(options: ScanOptions = {}): ExperienceGuardianReport {
  const rootDir = options.rootDir ?? process.cwd();
  const designGuardian = runAiDesignGuardian({ rootDir });
  const uxFindings: ExperienceGuardianFinding[] = [];

  for (const dir of SCAN_DIRS) {
    for (const filePath of walkFiles(join(rootDir, dir)).filter((f) => f.endsWith(".tsx"))) {
      const content = readFileSync(filePath, "utf8");
      const rel = relative(rootDir, filePath).replace(/\\/g, "/");
      for (const check of UX_CHECKS) {
        if (check.pattern.test(content)) {
          uxFindings.push({
            id: `${check.id}-${rel}`,
            severity: "warning",
            category: check.category,
            message: check.message,
            file: rel,
            recommendedFix: "Review in Responsive Studio or Component Builder",
            autoFixAvailable: false,
          });
        }
        check.pattern.lastIndex = 0;
      }
    }
  }

  const findings: ExperienceGuardianFinding[] = [
    ...designGuardian.findings.map((f) => ({
      id: f.id,
      severity: f.severity,
      category: f.category === "accessibility" ? ("accessibility" as const) : ("poor-ux" as const),
      message: f.message,
      file: f.file,
      line: f.line,
      recommendedFix: f.recommendedFix,
      autoFixAvailable: f.autoFixAvailable,
    })),
    ...uxFindings.slice(0, 40),
  ];

  return {
    scannedAt: new Date().toISOString(),
    findings,
    autoFixCount: findings.filter((f) => f.autoFixAvailable).length,
    recommendations: [
      "Consolidate duplicate components in Component Registry",
      "Validate responsive breakpoints in Responsive Studio",
      "Run Accessibility Center audit for contrast issues",
    ],
    pass: findings.filter((f) => f.severity === "critical").length === 0,
  };
}
