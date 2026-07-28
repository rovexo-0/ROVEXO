/**
 * ROVEXO v1.0 — LOGIN / REGISTER CANONICAL FREEZE
 *
 * STATUS: OWNER APPROVED · LOCKED · FROZEN · CERTIFIED
 * Absolute: NO MORE CHANGES WITHOUT OWNER APPROVAL
 * Allowed only: bug · performance · accessibility · security fixes
 * Forbidden: structural changes · redesign · extra texts · parallel systems
 */

export const AUTH_LOGIN_REGISTER_CANONICAL_FREEZE_V1 = {
  version: "canonical-freeze-v1",
  status: "LOCKED_FROZEN_CERTIFIED",
  ownerCertified: true,
  freezeLocked: true,
  score: {
    login: "100%",
    register: "100%",
    freeze: "PASS",
    certification: "PASS",
  } as const,
  officialLocal: {
    login: "http://localhost:3000/login",
    register: "http://localhost:3000/register",
  } as const,
  login: {
    mandatory: [
      "RX Premium 3D Logo",
      "BUY • SELL • GROW",
      "Transparent PNG only",
      "No background",
      "Premium purple effect",
      "Mobile first",
      "Responsive",
      "Email",
      "Password",
      "Remember Me",
      "Forgot Password",
      "Sign In",
      "Secure Sign In",
      "Create Account",
    ] as const,
    removedForever: [
      "Welcome Back",
      "Good to see you again.",
      "duplicate texts",
      "duplicate logos",
      "dead spaces",
      "oversized components",
      "dead clicks",
    ] as const,
  },
  register: {
    mandatory: [
      "RX Premium 3D Logo",
      "BUY • SELL • GROW",
      "Transparent PNG only",
      "No background",
      "Full Name",
      "Email",
      "Password",
      "Confirm Password",
      "Terms & Conditions",
      "Optional marketing consent",
      "Create Free Account",
      "Secure Registration",
      "Sign In",
    ] as const,
    removedForever: [
      "Join ROVEXO Today",
      "duplicated texts",
      "duplicated logos",
      "empty spaces",
      "dead clicks",
    ] as const,
  },
  allowedPostFreeze: [
    "bug fixes",
    "performance fixes",
    "accessibility fixes",
    "security fixes",
  ] as const,
  forbiddenPostFreeze: [
    "structural changes",
    "duplicated implementations",
    "visual redesign",
    "additional texts",
    "additional pages",
    "alternative systems",
  ] as const,
  ssot: {
    freeze: "lib/auth/auth-login-register-canonical-freeze-v1.ts",
    login: "features/auth/components/LoginScreen.tsx",
    register: "features/auth/components/RegisterScreen.tsx",
    logo: "lib/brand/canonical-rx-3d-logo-freeze-v1.ts",
  } as const,
} as const;
