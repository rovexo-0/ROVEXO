/**
 * ROVEXO PRIORITY 0 — BUILD MUST LIVE
 * Absolute law: Build · CSS · Tailwind · Layout · Preview must PASS or product does not exist.
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · 2026-07-23 · NEVER REMOVE
 * Parent: lib/priority-0-v1.ts
 */

export const PRIORITY_0_BUILD_MUST_LIVE_V1 = {
  version: "1.0",
  codename: "BUILD_MUST_LIVE",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  locked: true,
  frozen: true,
  permanent: true,
  neverRemove: true,
  approvedAt: "2026-07-23",

  productDoesNotExistIfFail: [
    "BUILD",
    "CSS",
    "TAILWIND",
    "LAYOUT",
    "PREVIEW",
  ] as const,

  phase1WorkOrder: [
    "BUILD_FIX",
    "STYLES_ROVEXO_INDEX_CSS",
    "TAILWIND_VALIDATION",
    "POSTCSS_VALIDATION",
    "GLOBAL_CSS_VALIDATION",
    "ROOT_LAYOUT_VALIDATION",
    "IMPORT_VALIDATION",
    "PREVIEW_VALIDATION",
    "BUILD_PASS",
  ] as const,

  cssNotAllowed: [
    "INVALID_IMPORTS",
    "INVALID_VARIABLES",
    "INVALID_TOKENS",
    "INVALID_SYNTAX",
    "DUPLICATE_IMPORTS",
    "BROKEN_TAILWIND_CALLS",
    "NULL_VALUES",
    "EMPTY_FILES",
    "INVALID_ROOT_VARIABLES",
  ] as const,

  requiredGates: [
    "npm run build",
    "npm run typecheck",
    "npm run lint",
    "LOCAL_PREVIEW",
    "OWNER_PREVIEW",
  ] as const,

  failClosedCopy: {
    loadingInterface: "Loading interface...",
    placeholderImage: "Placeholder image.",
  } as const,

  fixOrder: [
    "FIX_BUILD_ERROR",
    "FIX_CSS_ERROR",
    "FIX_TAILWIND_ERROR",
    "FIX_ROOT_LAYOUT",
    "FIX_PREVIEW",
    "FIX_WHITE_SCREEN",
    "FIX_CONVERSATION_HUB",
    "VISUAL_CERTIFICATION",
    "ZERO_REGRESSION",
    "SPRINT_2_UNLOCKED",
  ] as const,

  sprintersBlockedUntil: [
    "BUILD_PASS",
    "CSS_PASS",
    "PREVIEW_PASS",
    "WHITE_SCREEN_PASS",
    "OWNER_CERTIFICATION_PASS",
  ] as const,

  entrypoints: {
    designSystemCss: "styles/rovexo/index.css",
    globalCss: "app/globals.css",
    rootLayout: "app/layout.tsx",
    postcss: "postcss.config.mjs",
    tokens: "styles/tokens.css",
  } as const,

  ssot: {
    code: "lib/priority-0-build-must-live-v1.ts",
    rule: ".cursor/rules/priority-0-build-must-live-v1.mdc",
    doc: "docs/engineering/PRIORITY_0_BUILD_MUST_LIVE_V1.md",
  } as const,
} as const;

export type Priority0BuildMustLiveV1 = typeof PRIORITY_0_BUILD_MUST_LIVE_V1;
