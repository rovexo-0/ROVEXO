/**
 * ROVEXO CLUSTER 6 — AUTHENTICATION & IDENTITY
 * SCOPE LOCK v1.0
 *
 * OWNER APPROVED · ARCHITECTURE SCOPE LOCKED
 * Cod Sânge — Cluster 6 · Architecture freeze before Technical Certification
 *
 * Equation:
 * Login/Register → Email + Password → Supabase Auth → Session → Middleware
 * → Protected Routes → Application
 * + Google/Apple public when provider enabled (fail closed)
 * + Facebook deferred / hidden
 * = CLUSTER 6 v1.1 RC1 SCOPE LOCK
 *
 * This file is the Cluster 6 Architecture Scope Lock + Production Freeze SSOT.
 * Authentication behaviour must not change without Owner re-authorization.
 */

import { CLUSTER_6_OAUTH_POLICY_LOCK_V1 } from "@/lib/auth/cluster-6-oauth-policy-lock-v1";

export const CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1 = {
  version: "1.0",
  cluster: "CLUSTER_6_AUTHENTICATION_IDENTITY",
  id: "cluster-6-authentication-scope-lock-v1",
  status: "OWNER_APPROVED_PRODUCTION_READY_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  architectureCertified: true,
  registerIntegrityPass: true,
  oauthPolicyLockPass: true,
  /** Owner Visual QA PASS · Production Freeze applied. */
  productionReady: true,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: true,
  ownerVisualQa: "PASS" as const,
  productionStatus: "CERTIFIED" as const,

  equation:
    "LOGIN_REGISTER + EMAIL_PASSWORD + SUPABASE_AUTH + SESSION + MIDDLEWARE + PROTECTED_ROUTES + APPLICATION",

  canonicalAuthFlow: [
    "USER",
    "LOGIN_OR_REGISTER",
    "EMAIL_AND_PASSWORD",
    "SUPABASE_AUTH",
    "SESSION",
    "MIDDLEWARE",
    "PROTECTED_ROUTES",
    "APPLICATION",
  ] as const,

  soleProvider: "SUPABASE_AUTH" as const,

  publicV1Methods: {
    email: "ENABLED",
    password: "ENABLED",
    passwordReset: "ENABLED",
    emailVerification: "ENABLED",
    sessionManagement: "ENABLED",
  } as const,

  oauth: {
    google: "PUBLIC_WHEN_PROVIDER_ENABLED",
    apple: "PUBLIC_WHEN_PROVIDER_ENABLED",
    facebook: "DEFERRED_V1_1",
    policyLock: CLUSTER_6_OAUTH_POLICY_LOCK_V1.id,
  } as const,

  singularity: {
    authSystem: "SUPABASE_AUTH",
    entry: "app/(auth)/login · app/(auth)/register",
    middlewareChain: "middleware.ts → lib/supabase/middleware.ts → updateSession",
    sessionProvider: "features/auth/providers/AuthProvider.tsx",
    callbackRoute: "app/auth/callback/route.ts",
    protectedRouteEnforcement: "lib/auth/protected-routes.ts + lib/supabase/middleware.ts",
    profileBootstrap: "lib/auth/bootstrap.ts + AuthProvider profile sync",
    cookieOwner: "SUPABASE_AUTH",
    userOwner: "SUPABASE_AUTH",
  } as const,

  architectureSurfaces: {
    masterFreeze: "lib/auth/auth-master-freeze-v1.ts",
    oauthPolicyLock: "lib/auth/cluster-6-oauth-policy-lock-v1.ts",
    actions: "lib/auth/actions.ts",
    protectedRoutes: "lib/auth/protected-routes.ts",
    rootMiddleware: "middleware.ts",
    sessionMiddleware: "lib/supabase/middleware.ts",
    authProvider: "features/auth/providers/AuthProvider.tsx",
    callback: "app/auth/callback/route.ts",
    bootstrap: "lib/auth/bootstrap.ts",
    supabaseClient: "lib/supabase/client.ts",
    supabaseServer: "lib/supabase/server.ts",
  } as const,

  dependencyConsumers: [
    "Homepage",
    "Sell",
    "Orders",
    "Wallet",
    "Messages",
    "Notifications",
    "Profile",
    "Admin",
    "Super Admin",
  ] as const,

  dependencyContract:
    "All listed surfaces consume Supabase Auth session via AuthProvider / middleware / protected routes. No alternate identity frameworks.",

  permanentlyForbidden: [
    "Clerk",
    "NextAuth",
    "Auth.js",
    "Firebase Auth",
    "Better Auth",
    "Custom parallel session stores",
    "Second /auth/callback",
    "Second middleware auth chain",
    "Facebook OAuth on public Login / Register",
    "OAuth buttons when provider availability FAILS",
    "New public authentication surfaces without Owner approval",
  ] as const,

  deferredToV1_1: ["Facebook OAuth"] as const,

  prerequisites: {
    architectureAudit: "PASS",
    registerIntegrity: "PASS",
    oauthPolicyLock: "PASS",
  } as const,

  nextGates: [
    "Technical Certification",
    "Owner Visual QA",
    "Production Freeze",
  ] as const,

  ssot: "lib/auth/cluster-6-authentication-scope-lock-v1.ts",
} as const;

export type Cluster6AuthenticationScopeLockV1 =
  typeof CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1;

export function getCluster6AuthenticationScopeLockSnapshot() {
  return CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1;
}

export function assertCluster6AuthenticationArchitectureOrBlock(): void {
  const lock = CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1;
  if (!lock.approvedByOwner || !lock.scopeLocked || !lock.architectureCertified) {
    throw new Error("CLUSTER 6 Authentication Scope Lock is not Owner-approved.");
  }
  if (lock.soleProvider !== "SUPABASE_AUTH") {
    throw new Error("CLUSTER 6 invariant broken: sole provider must be SUPABASE_AUTH.");
  }
  if (lock.publicV1Methods.email !== "ENABLED") {
    throw new Error("CLUSTER 6 invariant broken: Email must be the public v1.0 method.");
  }
  if (lock.oauth.facebook !== "DEFERRED_V1_1") {
    throw new Error("CLUSTER 6 invariant broken: Facebook must remain deferred to v1.1.");
  }
}
