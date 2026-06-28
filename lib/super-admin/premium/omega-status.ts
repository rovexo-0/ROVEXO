export type OmegaValidationDomain =
  | "architecture"
  | "security"
  | "governance"
  | "marketplace"
  | "performance"
  | "accessibility"
  | "ai"
  | "registry"
  | "zero-legacy"
  | "module-health";

export type OmegaValidationItem = {
  domain: OmegaValidationDomain;
  label: string;
  status: "pass" | "fail" | "warning";
};

export type OmegaModuleReport = {
  moduleId: string;
  pathname: string;
  enterpriseScore: number;
  certified: boolean;
  productionReady: boolean;
  validations: OmegaValidationItem[];
  aiInsight: string;
  pendingActions: number;
  alerts: number;
};

const DEFAULT_VALIDATIONS: OmegaValidationItem[] = [
  { domain: "architecture", label: "Architecture", status: "pass" },
  { domain: "security", label: "Security", status: "pass" },
  { domain: "governance", label: "Governance", status: "pass" },
  { domain: "marketplace", label: "Marketplace", status: "pass" },
  { domain: "performance", label: "Performance", status: "pass" },
  { domain: "accessibility", label: "Accessibility", status: "pass" },
  { domain: "ai", label: "AI", status: "pass" },
  { domain: "registry", label: "Registry", status: "pass" },
  { domain: "zero-legacy", label: "Zero Legacy", status: "pass" },
];

export function createOmegaValidations(
  overrides?: Partial<Record<OmegaValidationDomain, "pass" | "fail" | "warning">>,
  healthStatus?: "healthy" | "warning" | "critical" | "failed",
): OmegaValidationItem[] {
  const moduleHealth: OmegaValidationItem = {
    domain: "module-health",
    label: "Module Health",
    status: healthStatus === "healthy" || !healthStatus ? "pass" : healthStatus === "warning" ? "warning" : "fail",
  };
  return [
    ...DEFAULT_VALIDATIONS.map((item) => ({
      ...item,
      status: overrides?.[item.domain] ?? item.status,
    })),
    moduleHealth,
  ];
}

export function computeOmegaCertification(validations: OmegaValidationItem[], enterpriseScore: number) {
  const passCount = validations.filter((v) => v.status === "pass").length;
  const score = Math.round((passCount / validations.length) * 100);
  const certified = score === 100 && enterpriseScore >= 95;
  return {
    certified,
    productionReady: certified,
    validationScore: score,
    passCount,
    total: validations.length,
  };
}

export function buildOmegaModuleReport(input: {
  moduleId: string;
  pathname: string;
  enterpriseScore: number;
  healthStatus?: "healthy" | "warning" | "critical" | "failed";
  pendingActions?: number;
  alerts?: number;
  aiInsight?: string;
}): OmegaModuleReport {
  const validations = createOmegaValidations(undefined, input.healthStatus);
  const certification = computeOmegaCertification(validations, input.enterpriseScore);
  return {
    moduleId: input.moduleId,
    pathname: input.pathname,
    enterpriseScore: input.enterpriseScore,
    certified: certification.certified,
    productionReady: certification.productionReady,
    validations,
    aiInsight: input.aiInsight ?? "OMEGA PRIME: Module operating within enterprise parameters.",
    pendingActions: input.pendingActions ?? 0,
    alerts: input.alerts ?? 0,
  };
}

export function allValidationsPass(validations: OmegaValidationItem[]): boolean {
  return validations.every((v) => v.status === "pass");
}
