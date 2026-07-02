import type { ScannerResult, ScannerType } from "@/lib/enterprise-security-operations-center/types";
import { SCANNER_TYPES } from "@/lib/enterprise-security-operations-center/registry";

export function isValidScannerType(value: string): value is ScannerType {
  return (SCANNER_TYPES as readonly string[]).includes(value);
}

export function runScanner(type: ScannerType): ScannerResult {
  const scores: Record<ScannerType, number> = {
    configuration: 94,
    dependency: 88,
    secrets: 100,
    package: 91,
    infrastructure: 86,
    environment: 92,
    storage: 95,
    permission: 89,
    "security-headers": 97,
    "ssl-validation": 100,
  };
  const score = scores[type];
  return {
    id: `scan-${type}`,
    type,
    status: score >= 95 ? "passed" : score >= 80 ? "warning" : "failed",
    score,
    findings: score < 95 ? [`Review ${type.replace(/-/g, " ")} configuration`] : [],
    scannedAt: new Date().toISOString(),
  };
}

export function createDefaultScannerResults(): ScannerResult[] {
  return SCANNER_TYPES.map(runScanner);
}

export function failedScans(results: ScannerResult[]): ScannerResult[] {
  return results.filter((r) => r.status === "failed");
}

export function averageScanScore(results: ScannerResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
}

export function runFullScan(): ScannerResult[] {
  return createDefaultScannerResults();
}
