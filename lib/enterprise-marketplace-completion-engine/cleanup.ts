import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { CLEANUP_CATEGORIES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import type { CleanupProposal, MarketplaceCleanupResult } from "@/lib/enterprise-marketplace-completion-engine/types";

function labelize(value: string): string {
  return value.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function listFiles(relativeDir: string): string[] {
  const root = path.join(process.cwd(), relativeDir);
  if (!existsSync(root)) return [];
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(process.cwd(), full).replace(/\\/g, "/");
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") walk(full);
      else if (entry.isFile()) results.push(relative);
    }
  };
  walk(root);
  return results;
}

function findByPattern(files: string[], pattern: RegExp): string[] {
  return files.filter((f) => pattern.test(f));
}

export function runMarketplaceCleanupScan(): MarketplaceCleanupResult {
  const componentFiles = listFiles("components");
  const styleFiles = listFiles("styles");
  const appFiles = listFiles("app");
  const proposals: CleanupProposal[] = [];

  const addProposal = (
    category: (typeof CLEANUP_CATEGORIES)[number],
    target: string,
    message: string,
    options: Partial<Pick<CleanupProposal, "safe" | "requiresApproval" | "estimatedImpact">> = {},
  ) => {
    proposals.push({
      id: `cleanup-${category}-${proposals.length + 1}`,
      category,
      label: labelize(category),
      target,
      safe: options.safe ?? true,
      requiresApproval: options.requiresApproval ?? false,
      estimatedImpact: options.estimatedImpact ?? "low",
      message,
    });
  };

  for (const file of findByPattern([...componentFiles, ...appFiles], /\.(bak|old|tmp|backup)$/i)) {
    addProposal("temporary-files", file, "Remove temporary or backup file", { requiresApproval: true, estimatedImpact: "medium" });
  }

  for (const file of findByPattern(componentFiles, /(debug|experimental|temp)/i)) {
    addProposal("debug-components", file, "Review debug or experimental component for removal", { requiresApproval: true, estimatedImpact: "high" });
  }

  for (const file of findByPattern(componentFiles, /legacy|deprecated/i)) {
    addProposal("legacy-files", file, "Migrate or remove legacy component", { requiresApproval: true, estimatedImpact: "high" });
  }

  for (const file of findByPattern([...componentFiles, ...styleFiles], /\.css$/)) {
    if (file.includes("unused") || file.includes("orphan")) {
      addProposal("unused-css", file, "Review unused stylesheet for removal", { requiresApproval: true });
    }
  }

  if (proposals.length === 0) {
    addProposal("unused-components", "platform", "No cleanup required — marketplace codebase clean", { safe: true, estimatedImpact: "low" });
  }

  const safeProposals = proposals.filter((p) => p.safe).length;

  return {
    scannedAt: new Date().toISOString(),
    proposals,
    totalProposals: proposals.length,
    safeProposals,
  };
}
