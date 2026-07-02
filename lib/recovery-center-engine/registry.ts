import type { RecoveryAutomationAction, RecoveryRollbackTarget } from "@/lib/recovery-center-engine/types";

export const RECOVERY_BACKUP_TYPES = [
  "full",
  "database",
  "media",
  "assets",
  "theme",
  "configuration",
  "environment",
  "api",
  "security",
  "integrations",
  "incremental",
] as const;

export const RECOVERY_ROLLBACK_TARGETS: RecoveryRollbackTarget[] = [
  { id: "homepage", label: "Homepage", icon: "🏠", module: "homepage-builder", rollbackAvailable: true },
  { id: "themes", label: "Themes", icon: "🎨", module: "theme-studio", rollbackAvailable: true },
  { id: "menus", label: "Menus", icon: "🧭", module: "menu-builder", rollbackAvailable: true },
  { id: "visual-cms", label: "Visual CMS", icon: "🎨", module: "visual-cms", rollbackAvailable: true },
  { id: "assets", label: "Assets", icon: "✨", module: "asset-manager", rollbackAvailable: true },
  { id: "settings", label: "Settings", icon: "⚙️", module: "platform", rollbackAvailable: true },
  { id: "platform-config", label: "Platform Configuration", icon: "🧩", module: "platform-studio", rollbackAvailable: true },
  { id: "integrations", label: "Integrations", icon: "🔌", module: "integrations-engine", rollbackAvailable: true },
  { id: "ai-config", label: "AI Configuration", icon: "🤖", module: "ai-engine", rollbackAvailable: true },
  { id: "feature-flags", label: "Feature Flags", icon: "🚩", module: "platform", rollbackAvailable: true },
  { id: "notifications", label: "Notifications", icon: "🔔", module: "notifications-engine", rollbackAvailable: true },
  { id: "operations", label: "Operations Settings", icon: "🛰️", module: "operations-center", rollbackAvailable: true },
  { id: "recovery", label: "Recovery Settings", icon: "💾", module: "recovery-center", rollbackAvailable: true },
];

export const RECOVERY_RESTORE_TYPES = [
  "safe",
  "emergency",
  "partial",
  "complete",
  "database",
  "assets",
  "theme",
  "configuration",
  "environment",
] as const;

export const RECOVERY_AUTOMATION_ACTIONS: RecoveryAutomationAction[] = [
  { id: "automatic-backup", label: "Automatic Backup", description: "Schedule encrypted platform backups", enabled: true },
  { id: "automatic-verification", label: "Automatic Verification", description: "Verify backup integrity after completion", enabled: true },
  { id: "automatic-rollback-validation", label: "Rollback Validation", description: "Validate rollback bundles before publish", enabled: true },
  { id: "automatic-restore-validation", label: "Restore Validation", description: "Run health checks after restore", enabled: true },
  { id: "automatic-integrity-scan", label: "Integrity Scan", description: "Scan configuration and asset integrity", enabled: true },
  { id: "automatic-health-check", label: "Health Check", description: "Post-recovery platform health verification", enabled: true },
  { id: "automatic-alerts", label: "Alert Generation", description: "Generate alerts for backup and recovery failures", enabled: true },
];

export const RECOVERY_REPORT_TYPES = [
  "backup",
  "recovery",
  "restore",
  "audit",
  "incident",
  "availability",
  "business-continuity",
  "compliance",
] as const;
