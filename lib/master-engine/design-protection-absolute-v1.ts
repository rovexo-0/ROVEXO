/**
 * ROVEXO Design Protection Absolute v1.1
 * P0 ABSOLUTE · CANONICAL FREEZE · OWNER APPROVED · PERMANENT FOR v1.0
 *
 * Owner-approved design always wins.
 * Engines and agents protect it — never redesign, rebuild, or duplicate it.
 */

export const DESIGN_PROTECTION_ABSOLUTE_NAME =
  "ROVEXO DESIGN PROTECTION ABSOLUTE" as const;
export const DESIGN_PROTECTION_ABSOLUTE_VERSION = "1.1" as const;
export const DESIGN_PROTECTION_ABSOLUTE_STATUS =
  "CANONICAL FREEZE · P0 ABSOLUTE · OWNER APPROVED · PERMANENT" as const;

export const DESIGN_PROTECTION_EQUATION =
  "ONE PAGE = ONE IMPLEMENTATION = ONE SSOT = ONE DESIGN = ONE RESPONSIVE ENGINE = ONE CANONICAL VERSION" as const;

export const DESIGN_PROTECTION_ABSOLUTE_RULE =
  "THE RESPONSIVE ENGINE MUST ADAPT TO THE DESIGN. THE DESIGN SHALL NEVER ADAPT TO THE RESPONSIVE ENGINE." as const;

export const DESIGN_PROTECTION_GOLDEN_RULE =
  "IF THE OWNER APPROVED IT, PROTECT IT. DO NOT REBUILD IT. DO NOT REDESIGN IT. DO NOT DUPLICATE IT. PROTECT IT." as const;

/** Systems forbidden from modifying Owner-approved design. */
export const DESIGN_PROTECTION_FORBIDDEN_SYSTEMS = [
  "Full Width Engine",
  "Responsive Engine",
  "Adaptive Engine",
  "Theme Engine",
  "Accessibility Engine",
  "Future AI Engines",
  "Future Optimization Engines",
  "Future Layout Engines",
  "CSS Overrides",
  "Hot Fix Systems",
  "Automated Refactors",
  "Cursor Agents",
] as const;

/** Canonical Owner-approved implementations may only receive these. */
export const DESIGN_PROTECTION_CANONICAL_ALLOWED = [
  "bug fixes",
  "performance improvements",
  "accessibility improvements",
  "responsive adaptations",
  "overflow prevention",
  "alignment fixes",
  "security fixes",
  "browser compatibility fixes",
] as const;

/** Forbidden against Owner-approved / canonical implementations. */
export const DESIGN_PROTECTION_CANONICAL_FORBIDDEN = [
  "redesign",
  "component replacement",
  "visual modifications",
  "icon replacement",
  "colour modifications",
  "layout redesign",
  "changing spacing tokens",
  "changing dimensions approved by Owner",
  "creating Balance v2",
  "creating Wallet v2",
  "creating Checkout v2",
  "creating hidden duplicated implementations",
] as const;

/** Owner-approved design must never be altered as redesign by engines. */
export const DESIGN_PROTECTION_IMMUTABLE = [
  "Owner-approved UI",
  "Owner-approved design",
  "Owner-approved dimensions",
  "Owner-approved colours",
  "Owner-approved icons",
  "Owner-approved spacing",
  "Owner-approved animations",
  "Owner-approved components",
] as const;

/** Engines MAY only do these adaptations (design preserved). */
export const DESIGN_PROTECTION_ENGINE_ALLOWED = [
  "bug fixes",
  "performance improvements",
  "accessibility improvements",
  "responsive adaptations",
  "overflow prevention",
  "alignment fixes",
  "security fixes",
  "browser compatibility fixes",
  "adapt content layout without redesign",
  "adapt alignment",
  "adapt component height when required",
  "adapt internal spacing only when required to prevent overflow/clip/overlap",
  "adapt container size when required for full-width usage",
  "prevent overflow",
  "prevent clipped text",
  "prevent element overlap",
] as const;

/** Engines / agents MUST NEVER do these. */
export const DESIGN_PROTECTION_ENGINE_FORBIDDEN = [
  "redesign components",
  "modify approved UI",
  "create alternate components",
  "change approved positioning",
  "change colours",
  "change icons",
  "change Owner-approved design",
  "create different implementations per device",
  "iPhone-only / Android-only / tablet-only / desktop-only alternate UIs",
  "redesign because of Full Width",
  "resize everything 100%",
  "rebuild everything 100%",
  ...DESIGN_PROTECTION_CANONICAL_FORBIDDEN,
] as const;

/**
 * Full Width 100% means maximum available width usage + proper alignment /
 * spacing / responsive / a11y / visibility — NOT redesign/rebuild.
 */
export const DESIGN_PROTECTION_FULL_WIDTH_MEANS = [
  "maximum available width usage",
  "proper alignment",
  "proper spacing",
  "proper responsive behaviour",
  "proper accessibility",
  "proper visibility",
] as const;

export const DESIGN_PROTECTION_FULL_WIDTH_DOES_NOT_MEAN = [
  "redesign 100%",
  "resize everything 100%",
  "rebuild everything 100%",
] as const;

export const DESIGN_PROTECTION_DEVICE_PARITY = [
  "iPhone 17 Pro Max",
  "Samsung S26 Ultra",
  "Google Pixel",
  "Fold",
  "Tablet",
  "Desktop",
] as const;

export const DESIGN_PROTECTION_CHAIN = [
  "OWNER APPROVED DESIGN",
  "ALWAYS WINS",
  "RESPONSIVE ENGINE ADAPTS TO DESIGN",
  "DESIGN NEVER ADAPTS TO ENGINE",
  "APPROVED DESIGN PRESERVED",
  "PROTECT IT",
  "NEVER REDESIGN IT",
  "NEVER DUPLICATE IT",
] as const;

export function designProtectionAbsoluteSnapshot() {
  return {
    name: DESIGN_PROTECTION_ABSOLUTE_NAME,
    version: DESIGN_PROTECTION_ABSOLUTE_VERSION,
    status: DESIGN_PROTECTION_ABSOLUTE_STATUS,
    equation: DESIGN_PROTECTION_EQUATION,
    absoluteRule: DESIGN_PROTECTION_ABSOLUTE_RULE,
    goldenRule: DESIGN_PROTECTION_GOLDEN_RULE,
    forbiddenSystems: [...DESIGN_PROTECTION_FORBIDDEN_SYSTEMS],
    canonicalAllowed: [...DESIGN_PROTECTION_CANONICAL_ALLOWED],
    canonicalForbidden: [...DESIGN_PROTECTION_CANONICAL_FORBIDDEN],
    immutable: [...DESIGN_PROTECTION_IMMUTABLE],
    engineAllowed: [...DESIGN_PROTECTION_ENGINE_ALLOWED],
    engineForbidden: [...DESIGN_PROTECTION_ENGINE_FORBIDDEN],
    fullWidthMeans: [...DESIGN_PROTECTION_FULL_WIDTH_MEANS],
    fullWidthDoesNotMean: [...DESIGN_PROTECTION_FULL_WIDTH_DOES_NOT_MEAN],
    deviceParity: [...DESIGN_PROTECTION_DEVICE_PARITY],
    chain: [...DESIGN_PROTECTION_CHAIN],
  } as const;
}
