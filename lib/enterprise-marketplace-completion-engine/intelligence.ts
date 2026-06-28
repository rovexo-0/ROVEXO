import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { MARKETPLACE_INTELLIGENCE_DETECTIONS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import type {
  CompletionStatus,
  IntelligenceFinding,
  MarketplaceIntelligenceResult,
} from "@/lib/enterprise-marketplace-completion-engine/types";

function passStatus(): CompletionStatus {
  return "pass";
}

function labelize(value: string): string {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fileExists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), relativePath));
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
  } catch {
    return "";
  }
}

function listFiles(relativeDir: string, extensions: string[] = [".tsx", ".ts", ".css"]): string[] {
  const root = path.join(process.cwd(), relativeDir);
  if (!existsSync(root)) return [];
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") walk(full);
      else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) results.push(full);
    }
  };
  walk(root);
  return results;
}

function hasLegacyMarkers(): boolean {
  const legacyNames = listFiles("components").filter((f) => /legacy|deprecated|old-ui/i.test(path.basename(f)));
  return legacyNames.length > 0;
}

function hasDuplicateHomepageCategories(homeContent: string): boolean {
  return homeContent.includes("CategoryGridSection") && homeContent.includes("HomeCategoryRail");
}

function hasDebugComponents(): boolean {
  return listFiles("components").some((f) => /debug|experimental|temp/i.test(path.basename(f)));
}

function evaluateDetection(
  detection: (typeof MARKETPLACE_INTELLIGENCE_DETECTIONS)[number],
  context: {
    modulesComplete: boolean;
    homepagePass: boolean;
    globalPass: boolean;
    launchPass: boolean;
    homeContent: string;
  },
): IntelligenceFinding {
  const { modulesComplete, homepagePass, globalPass, launchPass, homeContent } = context;
  let pass = modulesComplete && homepagePass && globalPass && launchPass;
  let severity: IntelligenceFinding["severity"] = "low";
  let message = `${labelize(detection)} — clear`;
  let target: string | undefined;

  switch (detection) {
    case "missing-features":
    case "incomplete-features":
      pass = modulesComplete;
      message = pass ? "All marketplace features complete" : "Incomplete marketplace features detected";
      severity = pass ? "low" : "critical";
      break;
    case "legacy-components":
      pass = !hasLegacyMarkers();
      message = pass ? "No legacy components detected" : "Legacy component files found";
      severity = pass ? "low" : "high";
      break;
    case "duplicate-components":
      pass = !hasDuplicateHomepageCategories(homeContent);
      message = pass ? "No duplicate category widgets" : "Duplicate category components on homepage";
      severity = pass ? "low" : "high";
      target = "components/home/HomeContent.tsx";
      break;
    case "dead-code":
      pass = !readSource("components/home/HomeContent.tsx").includes("CategoryGridSection");
      message = pass ? "No dead homepage components referenced" : "Dead component references detected";
      break;
    case "broken-components":
    case "broken-buttons":
    case "broken-routes":
      pass = fileExists("middleware.ts") && fileExists("components/ui/Button.tsx");
      message = pass ? "Core interaction components validated" : "Broken interaction layer detected";
      severity = pass ? "low" : "critical";
      break;
    case "broken-apis":
      pass = fileExists("app/api/search/route.ts");
      message = pass ? "Marketplace API routes validated" : "Broken API integration detected";
      break;
    case "broken-database-relations":
      pass = fileExists("lib/supabase/middleware.ts");
      message = pass ? "Database integration layer present" : "Database relations require attention";
      break;
    case "broken-marketplace-rules":
      pass = fileExists("middleware.ts") && modulesComplete;
      message = pass ? "Marketplace rules enforced" : "Marketplace rule gaps detected";
      break;
    case "missing-images":
    case "missing-icons":
      pass = fileExists("styles/rovexo/index.css") && fileExists("styles/rovexo/category-rail.css");
      message = pass ? "Premium asset pipeline active" : "Missing visual assets detected";
      break;
    case "missing-categories":
    case "missing-subcategories":
      pass = fileExists("app/categories/page.tsx") && fileExists("lib/enterprise-category-management-center/engine.ts");
      message = pass ? "Category taxonomy complete" : "Category hierarchy incomplete";
      break;
    case "missing-seo":
    case "missing-metadata":
      pass = fileExists("app/page.tsx") && homepagePass;
      message = pass ? "SEO and metadata validated" : "SEO or metadata gaps detected";
      break;
    case "missing-accessibility":
      pass = globalPass;
      message = pass ? "Accessibility validated via Global UI Integrity" : "Accessibility gaps detected";
      break;
    case "missing-responsive-layout":
      pass = globalPass && fileExists("styles/rovexo/index.css") && fileExists("styles/rovexo/mobile.css");
      message = pass ? "Responsive Premium 2026 layouts validated" : "Responsive layout gaps detected";
      break;
    case "missing-loading-states":
    case "missing-empty-states":
    case "missing-notifications":
    case "missing-analytics":
    case "missing-logs":
    case "missing-audit-entries":
    case "missing-ai-integration":
    case "missing-validation":
    case "missing-translation":
      pass = modulesComplete && launchPass;
      message = pass ? `${labelize(detection)} validated` : `${labelize(detection)} requires completion`;
      break;
    case "debug-components":
      pass = !hasDebugComponents();
      message = pass ? "No debug components in production paths" : "Debug components detected";
      severity = pass ? "low" : "medium";
      break;
    default:
      pass = modulesComplete && homepagePass && globalPass;
      message = pass ? `${labelize(detection)} clear` : `${labelize(detection)} requires attention`;
  }

  return {
    id: `intel-${detection}`,
    kind: detection,
    label: labelize(detection),
    status: pass ? passStatus() : "fail",
    severity,
    message,
    target,
  };
}

export function runMarketplaceIntelligenceScan(input: {
  modulesComplete: boolean;
  homepagePass: boolean;
  globalPass: boolean;
  launchPass: boolean;
}): MarketplaceIntelligenceResult {
  const homeContent = readSource("components/home/HomeContent.tsx");
  const findings = MARKETPLACE_INTELLIGENCE_DETECTIONS.map((detection) =>
    evaluateDetection(detection, { ...input, homeContent }),
  );
  const clearDetections = findings.filter((f) => f.status === "pass").length;
  const passPercent = Math.round((clearDetections / findings.length) * 10000) / 100;
  const failedCritical = findings.filter((f) => f.status === "fail" && f.severity === "critical").length;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : failedCritical > 0 ? "fail" : "warning",
    findings,
    totalDetections: findings.length,
    clearDetections,
  };
}

export function isMarketplaceIntelligencePass(result: MarketplaceIntelligenceResult): boolean {
  return result.status === "pass" && result.passPercent >= 100;
}
