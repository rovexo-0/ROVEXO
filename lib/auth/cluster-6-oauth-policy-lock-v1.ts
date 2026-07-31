/**
 * ROVEXO CLUSTER 6 — OAUTH POLICY LOCK v1.1 (RC1 amendment)
 *
 * OWNER APPROVED · ARCHITECTURE POLICY LOCKED
 * Cod Sânge — Google + Apple OAuth RC1
 *
 * Public authentication UI:
 * - Email always enabled
 * - Google / Apple shown ONLY when Supabase provider availability PASSes (fail closed)
 * - Facebook remains deferred / hidden
 *
 * Parent RC1 SSOT: `lib/auth/oauth-rc1-public-providers-v1.ts`
 * Availability: `lib/auth/oauth-provider-availability.server.ts`
 */

export const CLUSTER_6_OAUTH_POLICY_LOCK_V1 = {
  version: "1.1",
  cluster: "CLUSTER_6_AUTHENTICATION_IDENTITY",
  id: "cluster-6-oauth-policy-lock-v1",
  status: "OWNER_APPROVED_POLICY_LOCKED",
  approvedByOwner: true,
  policyLocked: true,
  architectureCertified: true,
  /** Scope Lock applied — see cluster-6-authentication-scope-lock-v1. */
  scopeLocked: true,
  /**
   * Production Ready remains gated by live Supabase provider enablement.
   * Policy architecture is locked; live OAuth may still FAIL until ops enable providers.
   */
  productionReady: false,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: false,
  rc1: "oauth-rc1-public-providers-v1",

  equation:
    "EMAIL_PUBLIC + GOOGLE_WHEN_ENABLED + APPLE_WHEN_ENABLED + FACEBOOK_HIDDEN_FAIL_CLOSED",

  publicV1Methods: {
    email: "ENABLED",
    password: "ENABLED",
    passwordReset: "ENABLED",
    emailVerification: "ENABLED",
    sessionManagement: "ENABLED",
  } as const,

  codeReadyUiGated: {
    google: {
      status: "PUBLIC_WHEN_PROVIDER_ENABLED",
      implementation: "PRESERVED",
      callback: "PRESERVED",
      publicLoginRegisterUi: "GATED_BY_AVAILABILITY",
      publicVerifyEmailUi: "FORBIDDEN",
    },
    apple: {
      status: "PUBLIC_WHEN_PROVIDER_ENABLED",
      implementation: "PRESERVED",
      callback: "PRESERVED",
      publicLoginRegisterUi: "GATED_BY_AVAILABILITY",
      publicVerifyEmailUi: "FORBIDDEN",
    },
  } as const,

  deferredToV1_1: ["Facebook OAuth"] as const,

  publicAuthSurfaces: [
    "app/(auth)/login/page.tsx → LoginScreen (OAuth gated)",
    "app/(auth)/register/page.tsx → RegisterScreen (OAuth gated)",
    "app/(auth)/verify-email/page.tsx → AuthForm (showOAuth=false)",
    "app/(auth)/forgot-password/page.tsx → ForgotPasswordScreen",
    "app/(auth)/reset-password/page.tsx → ResetPasswordScreen",
  ] as const,

  preservedInfrastructure: {
    oauthAction: "lib/auth/actions.ts → signInWithOAuthProvider",
    oauthButtons: "features/auth/components/AuthOAuthButtons.tsx",
    callback: "app/auth/callback/route.ts",
    availabilityProbe: "lib/auth/oauth-provider-availability.server.ts",
    authFormOptIn: "features/auth/components/AuthForm.tsx → showOAuth default false",
  } as const,

  permanentlyForbiddenWithoutOwnerApproval: [
    "Facebook on public Login / Register",
    "Showing OAuth buttons when provider probe FAILS",
    "Second authentication system",
    "New public authentication surfaces",
  ] as const,

  relatedFreezes: {
    authMasterFreeze: "lib/auth/auth-master-freeze-v1.ts",
    authUiMasterFreeze: "lib/auth/auth-ui-master-freeze-v1.2.ts",
    compactPremium: "lib/auth/auth-ui-compact-premium-v1.4.ts",
    oauthConfigurationGoldenLaw: "lib/auth/oauth-configuration-golden-law-v1.ts",
    oauthConfigurationFreeze: "lib/auth/oauth-configuration-freeze-v1.ts",
    oauthRc1: "lib/auth/oauth-rc1-public-providers-v1.ts",
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
  if (lock.codeReadyUiGated.google.publicLoginRegisterUi !== "GATED_BY_AVAILABILITY") {
    throw new Error("CLUSTER 6 RC1: Google must be availability-gated on Login/Register.");
  }
  if (lock.codeReadyUiGated.apple.publicLoginRegisterUi !== "GATED_BY_AVAILABILITY") {
    throw new Error("CLUSTER 6 RC1: Apple must be availability-gated on Login/Register.");
  }
}
