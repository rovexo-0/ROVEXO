/** ROVEXO AUTH v1 — re-exports AUTH_MASTER_SPEC v1.0 + MASTER FREEZE SSOT */

import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";

export {
  AUTH_MASTER_SPEC,
  AUTH_MASTER_SPEC_VERSION,
  type AuthSplashPhase,
} from "@/lib/auth/master-spec";

export {
  AUTH_MASTER_FREEZE_V1,
  type AuthMasterFreezeV1,
} from "@/lib/auth/auth-master-freeze-v1";

export {
  OAUTH_CONFIGURATION_FREEZE_V1,
  type OauthConfigurationFreezeV1,
} from "@/lib/auth/oauth-configuration-freeze-v1";

export {
  ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1,
  type RovexoOauthConfigurationGoldenLawV1,
} from "@/lib/auth/oauth-configuration-golden-law-v1";

export {
  AUTH_SENIOR_AUDIT_V1,
  type AuthSeniorAuditV1,
} from "@/lib/auth/auth-senior-audit-v1";

export {
  AUTH_UI_MASTER_FREEZE_V1_2,
  type AuthUiMasterFreezeV12,
} from "@/lib/auth/auth-ui-master-freeze-v1.2";

export {
  AUTH_UI_COMPACT_PREMIUM_V1_3,
  type AuthUiCompactPremiumV13,
} from "@/lib/auth/auth-ui-compact-premium-v1.3";

export {
  AUTH_UI_COMPACT_PREMIUM_V1_4,
  type AuthUiCompactPremiumV14,
} from "@/lib/auth/auth-ui-compact-premium-v1.4";

export {
  CLUSTER_6_OAUTH_POLICY_LOCK_V1,
  assertCluster6OauthPolicyOrBlock,
  getCluster6OauthPolicyLockSnapshot,
  type Cluster6OauthPolicyLockV1,
} from "@/lib/auth/cluster-6-oauth-policy-lock-v1";

export {
  OAUTH_RC1_PUBLIC_PROVIDERS_V1,
  resolvePublicOauthProviders,
  type OauthRc1PublicProvider,
  type OauthProviderAvailability,
} from "@/lib/auth/oauth-rc1-public-providers-v1";

export {
  CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1,
  assertCluster6AuthenticationArchitectureOrBlock,
  getCluster6AuthenticationScopeLockSnapshot,
  type Cluster6AuthenticationScopeLockV1,
} from "@/lib/auth/cluster-6-authentication-scope-lock-v1";

export {
  EMAIL_VERIFICATION_UX_V1,
  authVerifyEmailRedirectUrl,
  isEmailConfirmationOtpType,
  type EmailVerificationUxV1,
} from "@/lib/auth/email-verification-ux-v1";

export const AUTH_MODULE_VERSION = AUTH_MASTER_SPEC_VERSION;

export const AUTH_ROUTES = {
  ...AUTH_MASTER_SPEC.routes,
  /** @deprecated Splash removed — redirects to Login. */
  splash: "/login" as const,
  /** @deprecated Welcome removed — redirects to Login. */
  welcome: "/login" as const,
};

export const AUTH_MOBILE_REFERENCE = AUTH_MASTER_SPEC.mobileReference;

export const AUTH_STARTUP = AUTH_MASTER_SPEC.startup;

/** @deprecated Splash removed — values retained for migration tests only. */
export const AUTH_SPLASH = {
  phases: AUTH_MASTER_SPEC.splash.phases,
  fadeDurationMs: AUTH_MASTER_SPEC.splash.fadeDurationMs,
  minDisplayMs: AUTH_MASTER_SPEC.splash.minDisplayMs,
  maxWaitMs: AUTH_MASTER_SPEC.splash.maxWaitMs,
} as const;
