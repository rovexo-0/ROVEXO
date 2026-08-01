/**
 * ROVEXO Sell UI Polish Phase 1 — Product QA
 * STATUS: OWNER APPROVED · IMPLEMENTED · AWAITING PREVIEW GATES
 */

export const SELL_UI_POLISH_PRODUCT_QA_V1 = {
  id: "sell-ui-polish-product-qa-v1",
  page: "sell",
  route: "/sell",
  status: "IMPLEMENTED_AWAITING_PREVIEW",
  implementationAllowed: true,
  priceAlreadyInline: true,
  quantityAlreadyInline: true,
  occasionCareAbsent: true,
  documents: {
    audit: "docs/modules/sell/UI_POLISH_PRODUCT_QA_AUDIT.md",
    plan: "docs/modules/sell/UI_POLISH_IMPROVEMENT_PLAN.md",
    masterUiSpec: "docs/modules/sell/MASTER_UI_SPECIFICATION.md",
  },
  applied: [
    "price_gbp_adornment_display_only",
    "quantity_icon_fix",
    "dead_stepper_css_removed",
    "attribute_picker_visual_polish",
    "compatibility_label_ui_only",
    "parcel_visual_tokens",
  ] as const,
  forbidden: [
    "attribute_engine_logic",
    "publish_engine",
    "validation_rules",
    "api",
    "db",
    "shipping_logic",
    "occasion_care_fields",
    "commit",
    "push",
    "production",
  ] as const,
} as const;

export type SellUiPolishProductQaV1 = typeof SELL_UI_POLISH_PRODUCT_QA_V1;
