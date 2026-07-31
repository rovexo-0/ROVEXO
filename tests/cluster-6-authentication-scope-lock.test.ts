import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1,
  assertCluster6AuthenticationArchitectureOrBlock,
} from "@/lib/auth/cluster-6-authentication-scope-lock-v1";
import { CLUSTER_6_OAUTH_POLICY_LOCK_V1 } from "@/lib/auth/cluster-6-oauth-policy-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 6 Authentication Scope Lock", () => {
  const lock = CLUSTER_6_AUTHENTICATION_SCOPE_LOCK_V1;

  it("is Owner-approved architecture Scope Locked (not Production Freeze)", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.architectureCertified).toBe(true);
    expect(lock.registerIntegrityPass).toBe(true);
    expect(lock.oauthPolicyLockPass).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_6_AUTHENTICATION_IDENTITY");
    expect(lock.soleProvider).toBe("SUPABASE_AUTH");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.ownerVisualQa).toBe("PASS");
    expect(lock.productionStatus).toBe("CERTIFIED");
    expect(lock.canonicalAuthFlow).toEqual([
      "USER",
      "LOGIN_OR_REGISTER",
      "EMAIL_AND_PASSWORD",
      "SUPABASE_AUTH",
      "SESSION",
      "MIDDLEWARE",
      "PROTECTED_ROUTES",
      "APPLICATION",
    ]);
    expect(lock.oauth.google).toBe("PUBLIC_WHEN_PROVIDER_ENABLED");
    expect(lock.oauth.apple).toBe("PUBLIC_WHEN_PROVIDER_ENABLED");
    expect(lock.oauth.facebook).toBe("DEFERRED_V1_1");
    expect(lock.deferredToV1_1).toContain("Facebook OAuth");
    assertCluster6AuthenticationArchitectureOrBlock();
  });

  it("aligns with OAuth Policy Lock prerequisites", () => {
    expect(CLUSTER_6_OAUTH_POLICY_LOCK_V1.policyLocked).toBe(true);
    expect(CLUSTER_6_OAUTH_POLICY_LOCK_V1.scopeLocked).toBe(true);
    expect(lock.prerequisites.oauthPolicyLock).toBe("PASS");
    expect(lock.oauth.policyLock).toBe(CLUSTER_6_OAUTH_POLICY_LOCK_V1.id);
  });

  it("locks singularity: one middleware chain · one callback · one provider", () => {
    const rootMw = readSource("middleware.ts");
    expect(rootMw).toContain('from "@/lib/supabase/middleware"');
    expect(rootMw).toContain("updateSession");
    expect(rootMw).not.toContain("Clerk");
    expect(rootMw).not.toContain("NextAuth");

    const sessionMw = readSource("lib/supabase/middleware.ts");
    expect(sessionMw).toContain("createServerClient");
    expect(sessionMw).toContain("AUTH_PROTECTED_PREFIXES");
    expect(sessionMw).toContain("/auth/callback");

    const callbackFiles = readdirSync(join(process.cwd(), "app/auth/callback"));
    expect(callbackFiles).toContain("route.ts");
    expect(callbackFiles.filter((f) => f.endsWith("route.ts"))).toHaveLength(1);

    const callback = readSource("app/auth/callback/route.ts");
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain("syncAutoVerifiedProfile");

    const layout = readSource("app/layout.tsx");
    expect(layout).toContain("AuthProvider");
    expect(layout).not.toContain("SessionProvider");
  });

  it("forbids parallel auth frameworks in canonical auth surfaces", () => {
    for (const file of [
      "lib/auth/actions.ts",
      "features/auth/providers/AuthProvider.tsx",
      "lib/auth/bootstrap.ts",
      "lib/supabase/client.ts",
      "lib/supabase/server.ts",
    ]) {
      const source = readSource(file);
      for (const forbidden of lock.permanentlyForbidden.slice(0, 5)) {
        expect(source, `${file} must not contain ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("keeps AuthForm OAuth off by default and dependency prefixes under protected routes", () => {
    const form = readSource("features/auth/components/AuthForm.tsx");
    expect(form).toContain("showOAuth = false");

    const protectedRoutes = readSource("lib/auth/protected-routes.ts");
    for (const prefix of ["/sell", "/orders", "/wallet", "/inbox", "/account", "/admin", "/super-admin", "/notifications"]) {
      expect(protectedRoutes).toContain(`"${prefix}"`);
    }
  });
});
