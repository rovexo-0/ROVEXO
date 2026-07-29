/**
 * ROVEXO CLUSTER 6 — OAUTH POLICY LOCK v1.0
 *
 * OWNER APPROVED · ARCHITECTURE POLICY LOCKED
 * Cod Sânge — Cluster 6 · Owner Authentication Policy Decision
 *
 * Public v1.0 authentication UI = EMAIL ONLY.
 * Google / Apple = code-ready, UI-gated (not public surfaces).
 * Facebook = deferred to v1.1.
 *
 * This file locks OAuth product policy.
 * Cluster 6 Scope Lock: `lib/auth/cluster-6-authentication-scope-lock-v1.ts`.
 * Does not grant Technical Cert, Owner Visual QA, or Production Freeze.
 */

export const CLUSTER_6_OAUTH_POLICY_LOCK_V1 = {
  version: "1.0",
  cluster: "CLUSTER_6_AUTHENTICATION_IDENTITY",
  id: "cluster-6-oauth-policy-lock-v1",
  status: "OWNER_APPROVED_POLICY_LOCKED",
  approvedByOwner: true,
  policyLocked: true,
  architectureCertified: true,
  /** Scope Lock applied — see cluster-6-authentication-scope-lock-v1. */
  scopeLocked: true,
  /** Owner Visual QA PASS · Production Freeze applied (see authentication scope lock). */
  productionReady: true,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: true,

  equation: "EMAIL_PUBLIC_UI + GOOGLE_APPLE_CODE_READY_UI_GATED + FACEBOOK_DEFERRED_V1_1",

  publicV1Methods: {
    email: "ENABLED",
    password: "ENABLED",
    passwordReset: "ENABLED",
    emailVerification: "ENABLED",
    sessionManagement: "ENABLED",
  } as const,

  codeReadyUiGated: {
    google: {
      status: "CODE_READY_UI_GATED",
      implementation: "PRESERVED",
      callback: "PRESERVED",
      publicLoginRegisterUi: "FORBIDDEN",
      publicVerifyEmailUi: "FORBIDDEN",
    },
    apple: {
      status: "CODE_READY_UI_GATED",
      implementation: "PRESERVED",
      callback: "PRESERVED",
      publicLoginRegisterUi: "FORBIDDEN",
      publicVerifyEmailUi: "FORBIDDEN",
    },
  } as const,

  deferredToV1_1: ["Facebook OAuth"] as const,

  publicAuthSurfaces: [
    "app/(auth)/login/page.tsx → LoginScreen",
    "app/(auth)/register/page.tsx → RegisterScreen",
    "app/(auth)/verify-email/page.tsx → AuthForm (showOAuth=false)",
    "app/(auth)/forgot-password/page.tsx → ForgotPasswordScreen",
    "app/(auth)/reset-password/page.tsx → ResetPasswordScreen",
  ] as const,

  preservedInfrastructure: {
    oauthAction: "lib/auth/actions.ts → signInWithOAuthProvider",
    oauthButtons: "features/auth/components/AuthOAuthButtons.tsx",
    callback: "app/auth/callback/route.ts",
    authFormOptIn: "features/auth/components/AuthForm.tsx → showOAuth default false",
  } as const,

  permanentlyForbiddenWithoutOwnerApproval: [
    "Public OAuth buttons on Login / Register / Verify Email / Forgot / Reset",
    "Restoring Facebook to public v1.0 UI",
    "Second authentication system",
    "New public authentication surfaces",
  ] as const,

  relatedFreezes: {
    authMasterFreeze: "lib/auth/auth-master-freeze-v1.ts",
    authUiMasterFreeze: "lib/auth/auth-ui-master-freeze-v1.2.ts",
    compactPremium: "lib/auth/auth-ui-compact-premium-v1.4.ts",
    oauthConfigurationGoldenLaw: "lib/auth/oauth-configuration-golden-law-v1.ts",
    oauthConfigurationFreeze: "lib/auth/oauth-configuration-freeze-v1.ts",
  } as const,

  ssot: "lib/auth/cluster-6-oauth-policy-lock-v1.ts",
} as const;

export type Cluster6OauthPolicyLockV1 = typeof CLUSTER_6_OAUTH_POLICY_LOCK_V1;

export function getCluster6OauthPolicyLockSnapshot() {
  return CLUSTER_6_OAUTH_POLICY_LOCK_V1;
}

export function assertCluster6OauthPolicyOrBlock(): void {
  const lock = CLUSTER_6_OAUTH_POLICY_LOCK_V1;
  if (!lock.approvedByOwner || !lock.policyLocked || !lock.architectureCertified) {
    throw new Error("CLUSTER 6 OAuth Policy Lock is not Owner-approved.");
  }
  if (lock.publicV1Methods.email !== "ENABLED") {
    throw new Error("CLUSTER 6 invariant broken: Email must be the public v1.0 method.");
  }
}
