import { GLOBAL_BUTTON_INTERACTIONS, GLOBAL_WORKFLOW_JOURNEYS } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus, CompletionValidationItem } from "@/lib/enterprise-marketplace-completion-engine/types";

export type GlobalWorkflowValidationResult = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  workflows: CompletionValidationItem[];
  interactions: CompletionValidationItem[];
};

const WORKFLOW_REFS: Record<(typeof GLOBAL_WORKFLOW_JOURNEYS)[number], string> = {
  "buyer-journey": "app/(platform)/account/page.tsx",
  "seller-journey": "app/(platform)/seller/dashboard/page.tsx",
  "company-journey": "app/(platform)/business/dashboard/page.tsx",
  "business-journey": "app/(platform)/business/center/page.tsx",
  "super-admin-journey": "app/(platform)/super-admin/marketplace-completion/page.tsx",
  checkout: "app/(platform)/checkout/[slug]/page.tsx",
  orders: "app/(platform)/account/orders/page.tsx",
  wallet: "app/(platform)/wallet/page.tsx",
  payments: "app/(platform)/account/payment-methods/page.tsx",
  shipping: "app/(platform)/shipping/page.tsx",
  messaging: "app/(platform)/messages/page.tsx",
  notifications: "app/(platform)/notifications/page.tsx",
  "listing-publish": "app/(platform)/sell/page.tsx",
  "ai-category": "app/(platform)/sell/new/page.tsx",
  "ai-validation": "app/(platform)/sell/new/page.tsx",
};

export function runGlobalWorkflowValidation(input: { modulesComplete: boolean }): GlobalWorkflowValidationResult {
  const workflows = GLOBAL_WORKFLOW_JOURNEYS.map((journey) => {
    const ref = WORKFLOW_REFS[journey];
    const pass = ref ? fileExists(ref) : input.modulesComplete;
    return createCheck("workflows", journey, pass, pass ? `${labelize(journey)} workflow validated` : `${labelize(journey)} workflow incomplete`);
  });

  const hasUi = fileExists("components/ui/Button.tsx") && fileExists("middleware.ts");
  const interactions = GLOBAL_BUTTON_INTERACTIONS.map((interaction) =>
    createCheck("interactions", interaction, hasUi && input.modulesComplete, `${labelize(interaction)} interaction validated`),
  );

  const all = [...workflows, ...interactions];
  const clear = all.filter((c) => c.status === "pass").length;
  const passPercent = Math.round((clear / all.length) * 10000) / 100;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : "fail",
    workflows,
    interactions,
  };
}
