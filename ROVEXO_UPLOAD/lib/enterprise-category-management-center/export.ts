import type { CategoryManagementSnapshot } from "@/lib/enterprise-category-management-center/types";
import { EXPORT_FORMATS } from "@/lib/enterprise-category-management-center/registry";

export function isValidCategoryManagementExportFormat(value: string): value is (typeof EXPORT_FORMATS)[number] {
  return (EXPORT_FORMATS as readonly string[]).includes(value);
}

export function exportCategoryManagementSnapshot(snapshot: CategoryManagementSnapshot, format: (typeof EXPORT_FORMATS)[number]): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), snapshot }, null, 2);
  }
  if (format === "csv") {
    const headers = ["id", "name", "slug", "level", "status", "listingCount"];
    const rows = snapshot.treeNodes.map((n) =>
      headers.map((h) => JSON.stringify(String(n[h as keyof typeof n] ?? ""))).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }
  if (format === "excel") return exportCategoryManagementSnapshot(snapshot, "csv");
  return [
    "ROVEXO Enterprise Category Management Center Report",
    `Total Categories: ${snapshot.dashboard.totalCategories}`,
    `Overall PASS: ${snapshot.dashboard.overallPassPercent}%`,
    `Certification: ${snapshot.dashboard.certificationGranted ? "GRANTED" : "PENDING"}`,
    `Enterprise Score: ${snapshot.dashboard.enterpriseScore}%`,
    `Roots: ${snapshot.dashboard.roots} · Branches: ${snapshot.dashboard.branches} · Leaves: ${snapshot.dashboard.leaves}`,
  ].join("\n");
}
