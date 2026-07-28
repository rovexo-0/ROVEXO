/**
 * ROVEXO Level 8 Full Width + Responsive Execution Law v1.0
 * ABSOLUTE P0 · LEVEL 8 SENIOR ENGINEERING · MANDATORY · PERMANENT
 *
 * Engine automatically calculates available width/safe areas/screen/browser/OS
 * limits and adapts — without redesigning Owner-approved implementation.
 */

export const FW_RESPONSIVE_EXECUTION_NAME =
  "ROVEXO LEVEL 8 FULL WIDTH + RESPONSIVE EXECUTION" as const;
export const FW_RESPONSIVE_EXECUTION_VERSION = "1.0" as const;
export const FW_RESPONSIVE_EXECUTION_STATUS =
  "ABSOLUTE P0 · LEVEL 8 · MANDATORY EXECUTION · OWNER APPROVED" as const;
export const FW_RESPONSIVE_EXECUTION_LEVEL = 8 as const;

export const FW_RESPONSIVE_EXECUTION_OWNER_REQUIREMENTS = [
  "100% FULL WIDTH",
  "100% RESPONSIVE",
  "100% ADAPTIVE",
  "100% VISIBLE",
  "100% ALIGNED",
  "100% PRODUCTION READY",
] as const;

/** Mandatory engine calculate → adapt steps. */
export const FW_RESPONSIVE_EXECUTION_AUTO_STEPS = [
  {
    id: 1,
    calculate: "AVAILABLE WIDTH",
    action: "USE 100% OF AVAILABLE WIDTH",
  },
  {
    id: 2,
    calculate: "SAFE AREAS",
    action: "AUTOMATICALLY ADAPT",
  },
  {
    id: 3,
    calculate: "SCREEN SIZE",
    action: "AUTOMATICALLY ADAPT",
  },
  {
    id: 4,
    calculate: "BROWSER LIMITATIONS",
    action: "AUTOMATICALLY ADAPT",
  },
  {
    id: 5,
    calculate: "OS LIMITATIONS",
    action: "AUTOMATICALLY ADAPT",
  },
  {
    id: 6,
    calculate: "RESPONSIVE LIMITATIONS",
    action: "AUTOMATICALLY ADAPT",
  },
] as const;

export const FW_RESPONSIVE_EXECUTION_ALIGNMENT = [
  "PERFECT HORIZONTAL ALIGNMENT",
  "PERFECT VERTICAL ALIGNMENT",
  "PERFECT RESPONSIVE ALIGNMENT",
  "PERFECT ADAPTIVE ALIGNMENT",
  "PERFECT VISIBILITY",
] as const;

export const FW_RESPONSIVE_EXECUTION_DEVICES = [
  "ALL IPHONES",
  "ALL ANDROID DEVICES",
  "ALL PIXEL DEVICES",
  "ALL SAMSUNG DEVICES",
  "ALL FOLD DEVICES",
  "ALL TABLETS",
  "ALL DESKTOPS",
] as const;

export const FW_RESPONSIVE_EXECUTION_MODES = [
  "SMALL DISPLAYS",
  "LARGE DISPLAYS",
  "ZOOM MODES",
  "SAFE AREA MODES",
  "ACCESSIBILITY MODES",
  "PORTRAIT MODE",
  "LANDSCAPE MODE",
] as const;

export const FW_RESPONSIVE_EXECUTION_PRODUCTION_CHECKS = [
  "WIDTH",
  "HEIGHT",
  "ALIGNMENT",
  "VISIBILITY",
  "RESPONSIVE",
  "ADAPTIVE",
  "OVERFLOW",
  "CLIPPING",
  "CROPPING",
  "SAFE AREA",
  "SPACING",
  "VIEWPORT",
  "ACCESSIBILITY",
] as const;

export const FW_RESPONSIVE_EXECUTION_AUTO_FIX_ALLOWED = [
  "overflow problems",
  "clipping problems",
  "alignment problems",
  "responsive problems",
  "adaptive problems",
  "browser problems",
  "accessibility problems",
  "viewport problems",
  "rendering problems",
  "performance problems",
] as const;

export const FW_RESPONSIVE_EXECUTION_AUTO_FIX_WITHOUT = [
  "redesign",
  "replacing components",
  "changing dimensions",
  "changing Owner approved design",
  "changing Owner approved implementation",
] as const;

export const FW_RESPONSIVE_EXECUTION_CERTIFICATION = [
  "100% VISIBLE",
  "100% FULL WIDTH",
  "100% RESPONSIVE",
  "100% ADAPTIVE",
  "100% ALIGNED",
  "100% PRODUCTION READY",
] as const;

/** Any single occurrence fails certification. */
export const FW_RESPONSIVE_EXECUTION_FAIL_IF = [
  "1 hidden element",
  "1 cropped element",
  "1 overflow problem",
  "1 clipping problem",
  "1 responsive problem",
  "1 adaptive problem",
  "1 browser problem",
  "1 alignment problem",
  "1 spacing problem",
  "1 visibility problem",
] as const;

export const FW_RESPONSIVE_EXECUTION_MANDATE = [
  "DO NOT REDESIGN",
  "DO NOT REBUILD",
  "DO NOT REPLACE",
  "OPTIMIZE THE EXISTING IMPLEMENTATION",
  "FIX THE ROOT CAUSE",
  "KEEP THE OWNER APPROVED IMPLEMENTATION",
  "MAKE THE ENGINE ADAPT TO IT",
] as const;

export const FW_RESPONSIVE_EXECUTION_UNTIL = [
  "PERFECT ALIGNMENT",
  "PERFECT RESPONSIVE",
  "PERFECT FULL WIDTH",
  "PERFECT VISIBILITY",
  "PERFECT PRODUCTION READINESS",
] as const;

export const FW_RESPONSIVE_EXECUTION_ABSOLUTE_RULE =
  "OPTIMIZE THE EXISTING IMPLEMENTATION. FIX THE ROOT CAUSE. KEEP THE OWNER APPROVED IMPLEMENTATION. MAKE THE ENGINE ADAPT TO IT. DO NOT REDESIGN. DO NOT REBUILD. DO NOT REPLACE." as const;

export function fwResponsiveExecutionSnapshot() {
  return {
    name: FW_RESPONSIVE_EXECUTION_NAME,
    version: FW_RESPONSIVE_EXECUTION_VERSION,
    status: FW_RESPONSIVE_EXECUTION_STATUS,
    level: FW_RESPONSIVE_EXECUTION_LEVEL,
    ownerRequirements: [...FW_RESPONSIVE_EXECUTION_OWNER_REQUIREMENTS],
    autoSteps: FW_RESPONSIVE_EXECUTION_AUTO_STEPS.map((s) => ({ ...s })),
    alignment: [...FW_RESPONSIVE_EXECUTION_ALIGNMENT],
    devices: [...FW_RESPONSIVE_EXECUTION_DEVICES],
    modes: [...FW_RESPONSIVE_EXECUTION_MODES],
    productionChecks: [...FW_RESPONSIVE_EXECUTION_PRODUCTION_CHECKS],
    autoFixAllowed: [...FW_RESPONSIVE_EXECUTION_AUTO_FIX_ALLOWED],
    autoFixWithout: [...FW_RESPONSIVE_EXECUTION_AUTO_FIX_WITHOUT],
    certification: [...FW_RESPONSIVE_EXECUTION_CERTIFICATION],
    failIf: [...FW_RESPONSIVE_EXECUTION_FAIL_IF],
    mandate: [...FW_RESPONSIVE_EXECUTION_MANDATE],
    until: [...FW_RESPONSIVE_EXECUTION_UNTIL],
    absoluteRule: FW_RESPONSIVE_EXECUTION_ABSOLUTE_RULE,
  } as const;
}
