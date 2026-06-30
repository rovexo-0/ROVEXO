import type {
  EnterpriseModuleV2Descriptor,
  ModuleValidationResult,
  RegistryValidationReport,
} from "@/lib/enterprise-module-registry-v2/types";

const VALIDATION_CHECKS = [
  "descriptor",
  "permissions",
  "navigation",
  "routes",
  "featureFlags",
  "configuration",
  "dependencies",
  "api",
  "assets",
  "translations",
  "accessibility",
  "health",
  "audit",
  "monitoring",
  "recovery",
  "certification",
] as const;

function semverValid(version: string): boolean {
  return /^\d+\.\d+(\.\d+)?$/.test(version);
}

export function validateModuleDescriptor(module: EnterpriseModuleV2Descriptor): ModuleValidationResult {
  const checks: ModuleValidationResult["checks"] = [
    {
      id: "descriptor",
      label: "Descriptor",
      passed: Boolean(module.moduleId && module.moduleName && module.displayName && module.category && module.version),
      message: !module.moduleId ? "Missing moduleId" : undefined,
    },
    {
      id: "permissions",
      label: "Permissions",
      passed: module.permissions.length > 0 && module.permissions.every((p) => p.action && p.roles.length > 0),
    },
    {
      id: "navigation",
      label: "Navigation",
      passed: module.navigation.length > 0 && module.navigation.every((n) => n.href.startsWith("/")),
    },
    {
      id: "routes",
      label: "Routes",
      passed: module.routes.length > 0 && module.routes.every((r) => r.href.startsWith("/super-admin") || r.href === "/super-admin"),
    },
    {
      id: "featureFlags",
      label: "Feature Flags",
      passed: module.featureFlags.length > 0,
    },
    {
      id: "configuration",
      label: "Configuration",
      passed: Boolean(
        module.settingsSchema.draftKey &&
          module.settingsSchema.liveKey &&
          module.settingsSchema.historyKey &&
          module.configurationSchema.draftKey,
      ),
    },
    {
      id: "dependencies",
      label: "Dependencies",
      passed: Array.isArray(module.dependencies),
    },
    {
      id: "api",
      label: "API",
      passed: Boolean(module.apiSchema.snapshot && module.apiSchema.v1Snapshot),
    },
    {
      id: "assets",
      label: "Assets",
      passed: Boolean(module.icon),
    },
    {
      id: "translations",
      label: "Translations",
      passed: Boolean(module.description),
    },
    {
      id: "accessibility",
      label: "Accessibility",
      passed: module.navigation.every((n) => n.label.length > 0),
    },
    {
      id: "health",
      label: "Health",
      passed: Boolean(module.healthEndpoint),
    },
    {
      id: "audit",
      label: "Audit",
      passed: module.auditProvider.enabled,
    },
    {
      id: "monitoring",
      label: "Monitoring",
      passed: module.monitoringProvider.enabled,
    },
    {
      id: "recovery",
      label: "Recovery",
      passed: module.recoveryProvider.enabled,
    },
    {
      id: "certification",
      label: "Certification",
      passed: module.certificationProvider.enabled,
    },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const versionValid = semverValid(module.version) && semverValid(module.compatibilityVersion);

  if (!versionValid) {
    checks.push({ id: "version", label: "Version Semver", passed: false, message: "Invalid semver" });
  }

  return {
    moduleId: module.moduleId,
    valid: checks.every((c) => c.passed) && versionValid,
    score: versionValid ? score : Math.max(0, score - 10),
    checks,
  };
}

export function validateRegistryModules(modules: EnterpriseModuleV2Descriptor[]): RegistryValidationReport {
  const results = modules.map(validateModuleDescriptor);
  const overallScore =
    results.length === 0 ? 0 : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  return {
    scannedAt: new Date().toISOString(),
    overallValid: results.every((r) => r.valid),
    overallScore,
    modules: results,
  };
}

export { VALIDATION_CHECKS };
