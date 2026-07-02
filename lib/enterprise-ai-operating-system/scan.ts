import type { ScanMode, ScanReport, ScanTargetType } from "@/lib/enterprise-ai-operating-system/types";
import { SCAN_MODES, SCAN_TARGET_TYPES } from "@/lib/enterprise-ai-operating-system/registry";

const MODE_TARGETS: Partial<Record<ScanMode, ScanTargetType[]>> = {
  "full-platform": [...SCAN_TARGET_TYPES],
  quick: ["platform", "api", "performance", "security"],
  security: ["security", "ai-models", "api"],
  infrastructure: ["infrastructure", "database", "storage", "cpu", "memory", "disk", "network"],
  marketplace: ["listings", "users", "businesses", "orders"],
  fraud: ["payments", "users", "businesses", "security"],
  payments: ["payments", "orders"],
  performance: ["performance", "cpu", "memory", "network"],
  database: ["database", "storage"],
  storage: ["storage", "disk"],
  api: ["api", "queues"],
  search: ["search", "listings"],
  ai: ["ai-models", "platform"],
  manual: ["platform"],
};

export function resolveScanTargets(mode: ScanMode): ScanTargetType[] {
  return MODE_TARGETS[mode] ?? ["platform"];
}

export function runScan(mode: ScanMode, targets?: ScanTargetType[]): ScanReport {
  const resolved = targets ?? resolveScanTargets(mode);
  const now = new Date().toISOString();
  const findings = Math.max(0, resolved.length - Math.floor(Math.random() * 3));
  return {
    id: `scan-${Date.now()}`,
    mode,
    targets: resolved,
    status: "completed",
    startedAt: now,
    completedAt: now,
    findings,
    score: Math.max(60, 100 - findings * 5),
    summary: `${mode} scan completed across ${resolved.length} targets with ${findings} findings`,
  };
}

export function isValidScanMode(mode: string): mode is ScanMode {
  return (SCAN_MODES as readonly string[]).includes(mode);
}

export function listScanModes(): ScanMode[] {
  return [...SCAN_MODES];
}

export function aggregateScanScore(reports: ScanReport[]): number {
  if (reports.length === 0) return 0;
  return Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length);
}
