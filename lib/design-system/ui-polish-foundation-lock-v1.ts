/**
 * ROVEXO UI POLISH v1.0 — FOUNDATION LOCK
 *
 * STATUS: OWNER APPROVED · LOCKED
 *
 * Refine only. Do NOT redesign. Do NOT copy Vinted / eBay / other marketplaces.
 * Preserve ROVEXO visual identity (white background · ROVEXO Purple accent).
 *
 * Listing Card is permanently locked — excluded from UI Elements polish scope.
 */

export const UI_POLISH_FOUNDATION_LOCK_V1 = {
  id: "ui-polish-foundation-lock-v1",
  version: "1.0.0",
  status: "LOCKED",
  objective: "consistency_alignment_premium_maintainability",
  forbidden: [
    "redesign",
    "new_visual_identity",
    "copy_vinted",
    "copy_ebay",
    "copy_other_marketplace",
    "duplicate_components",
    "duplicate_styles",
    "listing_card_redesign",
  ] as const,
  pillars: {
    designTokens: [
      "brand_colors",
      "typography",
      "font_scale",
      "border_radius",
      "shadows",
      "elevation",
      "motion",
      "animation_timing",
    ] as const,
    components: [
      "primary_button",
      "secondary_button",
      "inputs",
      "dropdown",
      "search_field",
      "checkbox",
      "radio",
      "switch",
      "chips",
      "badges",
      "tabs",
    ] as const,
    uiElements: [
      "modal",
      "toast",
      "bottom_sheet",
      "empty_state",
      "loading",
      "skeleton",
      "success_state",
      "error_state",
      "warning_state",
      "information_state",
    ] as const,
    spacingAndLayout: [
      "padding_scale",
      "margin_scale",
      "grid_spacing",
      "section_spacing",
      "component_spacing",
      "button_height",
      "input_height",
      "icon_sizes",
      "layout_containers",
    ] as const,
  },
  globalRules: [
    "one_design_system",
    "one_component_library",
    "one_layout_system",
    "one_interaction_system",
    "zero_duplicated_components",
    "zero_duplicated_styles",
    "mobile_first",
    "white_background",
    "rovexo_purple_primary_accent",
    "preserve_existing_visual_identity",
  ] as const,
  listingCard: {
    status: "PERMANENTLY_LOCKED",
    ssot: "components/ui/ListingCard.tsx",
    styles: [
      "components/ui/ListingCard.module.css",
      "styles/rovexo/listing-card-official.css",
    ] as const,
    forbidden: [
      "product_image_layout",
      "card_dimensions",
      "price_position",
      "title_position",
      "favourite_icon",
      "badge_positions",
      "rating",
      "view_counter",
      "overall_card_appearance",
    ] as const,
    allowed: ["bug_fixes", "accessibility", "performance"] as const,
    excludedFromUiElementsPolish: true,
  },
  parents: [
    "lib/design-system/design-decision-001-internal-ui-v1.1.ts",
    "lib/design-system/design-decision-002-token-isolation-v1.ts",
    "lib/design-system/my-account-v1.ts",
    "lib/master-engine/design-protection-absolute-v1.ts",
    "lib/master-engine/master-full-width-contract-v1.ts",
  ] as const,
  implementationGate: [
    "master_ui_specification_approved",
    "one_page_at_a_time",
    "owner_visual_approval",
    "no_listing_card_edits",
  ] as const,
} as const;

export type UiPolishFoundationLockV1 = typeof UI_POLISH_FOUNDATION_LOCK_V1;
