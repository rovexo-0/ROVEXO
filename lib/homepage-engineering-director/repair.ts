import type { HomepageEngineeringScanResult } from "@/lib/homepage-engineering-director/types";

export type HomepageRepairAction = {
  id: string;
  action: string;
  target: string;
  safe: boolean;
  requiresApproval: boolean;
  status: "pass" | "pending" | "blocked";
  message: string;
};

export function planHomepageEngineeringRepairs(scan: HomepageEngineeringScanResult): HomepageRepairAction[] {
  if (scan.certificationEligible) {
    return [
      {
        id: "repair-none",
        action: "noop",
        target: "homepage",
        safe: true,
        requiresApproval: false,
        status: "pass",
        message: "No repairs required — Homepage Engineering Director PASS 100%",
      },
    ];
  }

  const actions: HomepageRepairAction[] = [];

  if (scan.legacyViolations.length > 0) {
    actions.push({
      id: "repair-legacy",
      action: "remove-legacy-imports",
      target: "HomeContent",
      safe: true,
      requiresApproval: false,
      status: "pending",
      message: `Remove legacy components: ${scan.legacyViolations.join(", ")}`,
    });
  }

  for (const component of scan.components.filter((c) => !c.complete)) {
    actions.push({
      id: `repair-${component.component}`,
      action: "complete-component",
      target: component.sourceRef,
      safe: !component.component.includes("footer"),
      requiresApproval: false,
      status: "pending",
      message: `Complete ${component.label}: ${component.message}`,
    });
  }

  for (const check of scan.checks.filter((c) => c.status === "fail" && c.category === "layout")) {
    actions.push({
      id: `repair-layout-${check.id}`,
      action: "compress-spacing",
      target: check.check,
      safe: true,
      requiresApproval: false,
      status: "pending",
      message: check.message,
    });
  }

  return actions.length > 0 ? actions : [
    {
      id: "repair-review",
      action: "manual-review",
      target: "homepage",
      safe: false,
      requiresApproval: true,
      status: "blocked",
      message: "Engineering violations require governance review",
    },
  ];
}

export function attemptHomepageEngineeringRepair(scan: HomepageEngineeringScanResult, validationOnlyMode = true): {
  planned: HomepageRepairAction[];
  executed: HomepageRepairAction[];
} {
  const planned = planHomepageEngineeringRepairs(scan);
  if (validationOnlyMode || scan.certificationEligible) {
    return { planned, executed: [] };
  }
  const executed = planned
    .filter((p) => p.safe && !p.requiresApproval)
    .map((p) => ({ ...p, status: "pass" as const, message: `${p.message} — validation-only simulation` }));
  return { planned, executed };
}
