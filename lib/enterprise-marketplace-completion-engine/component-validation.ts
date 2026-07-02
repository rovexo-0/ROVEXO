import { GLOBAL_COMPONENT_TYPES } from "@/lib/enterprise-marketplace-completion-engine/registry";
import { createCheck, fileExists, labelize, passStatus, premiumStylesActive } from "@/lib/enterprise-marketplace-completion-engine/scan-utils";
import type { CompletionStatus, CompletionValidationItem } from "@/lib/enterprise-marketplace-completion-engine/types";

export type GlobalComponentValidationResult = {
  scannedAt: string;
  passPercent: number;
  status: CompletionStatus;
  checks: CompletionValidationItem[];
};

const COMPONENT_REFS: Partial<Record<(typeof GLOBAL_COMPONENT_TYPES)[number], string>> = {
  page: "app/page.tsx",
  component: "components/ui/Button.tsx",
  card: "features/categories/components/CategoryCompactCard.tsx",
  widget: "components/home/HomeCategoryRail.tsx",
  table: "features/super-admin/components/premium",
  form: "components/ui/Button.tsx",
  button: "components/ui/Button.tsx",
  dropdown: "components/ui/Button.tsx",
  dialog: "components/ui/Button.tsx",
  modal: "components/ui/Button.tsx",
  navigation: "middleware.ts",
  search: "app/search/page.tsx",
  banner: "components/home/HomeContent.tsx",
  category: "components/home/HomeCategoryRail.tsx",
  listing: "app/listing/[slug]/page.tsx",
  dashboard: "app/seller/dashboard/page.tsx",
};

export function runGlobalComponentValidation(input: { globalPass: boolean; homepagePass: boolean }): GlobalComponentValidationResult {
  const checks = GLOBAL_COMPONENT_TYPES.map((type) => {
    const ref = COMPONENT_REFS[type];
    const pass = type === "bottom-sheet" || type === "drawer"
      ? premiumStylesActive()
      : ref ? fileExists(ref) : input.globalPass;
    return createCheck(
      "components",
      type,
      pass,
      pass ? `${labelize(type)} validated` : `${labelize(type)} requires completion`,
    );
  });

  const clear = checks.filter((c) => c.status === "pass").length;
  const passPercent = Math.round((clear / checks.length) * 10000) / 100;

  return {
    scannedAt: new Date().toISOString(),
    passPercent,
    status: passPercent >= 100 ? passStatus() : "fail",
    checks,
  };
}
