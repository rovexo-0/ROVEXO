import type { CommandOsOneClickOperation } from "@/lib/command-os-v4/types";

/** One-click operations orchestrated from Command OS — delegates to existing engines. */
export const COMMAND_OS_ONE_CLICK_OPERATIONS: CommandOsOneClickOperation[] = [
  { id: "full-audit", label: "Run Full Audit", description: "Marketplace, security, design, and shipping audits", action: "run-full-audit", icon: "📋", severity: "safe" },
  { id: "certification", label: "Run Certification", description: "Production certification gate validation", action: "run-certification", icon: "🏆", severity: "safe" },
  { id: "repair-assets", label: "Repair Broken Assets", description: "Scan and repair broken visual assets", action: "repair-assets", icon: "🖼️", severity: "safe" },
  { id: "repair-components", label: "Repair Broken Components", description: "AI Experience Guardian component repair", action: "repair-components", icon: "🧩", severity: "elevated" },
  { id: "optimize-assets", label: "Optimize Assets", description: "Asset optimizer scan and recommendations", action: "optimize-assets", icon: "⚡", severity: "safe" },
  { id: "optimize-images", label: "Optimize Images", description: "Image compression and asset optimization", action: "optimize-images", icon: "🗜️", severity: "safe" },
  { id: "health-scan", label: "Health Scan", description: "Full platform health dimension scan", action: "health-scan", icon: "💚", severity: "safe" },
  { id: "security-scan", label: "Security Scan", description: "Security engine audit and threat review", action: "security-scan", icon: "🔒", severity: "safe" },
  { id: "performance-scan", label: "Performance Scan", description: "Performance and observability review", action: "performance-scan", icon: "📈", severity: "safe" },
  { id: "xos-rescan", label: "Rescan Experience OS", description: "Full XOS screen, icon, and asset rescan", action: "xos-rescan", icon: "🎛️", severity: "elevated" },
  { id: "publish-platform", label: "Publish Platform", description: "Publish approved visual and experience changes", action: "publish-platform", icon: "🚀", severity: "critical" },
  { id: "rollback-platform", label: "Rollback Platform", description: "Rollback to previous published version", action: "rollback-platform", icon: "↩️", severity: "critical" },
  { id: "backup-platform", label: "Backup Platform", description: "Trigger platform backup snapshot", action: "backup-platform", icon: "💾", severity: "elevated" },
];

export function getCommandOsOneClickOperation(action: string): CommandOsOneClickOperation | undefined {
  return COMMAND_OS_ONE_CLICK_OPERATIONS.find((op) => op.action === action);
}
