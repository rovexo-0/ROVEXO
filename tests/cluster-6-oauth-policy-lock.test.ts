import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_6_OAUTH_POLICY_LOCK_V1,
  assertCluster6OauthPolicyOrBlock,
} from "@/lib/auth/cluster-6-oauth-policy-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 6 OAuth Policy Lock (RC1)", () => {
  const lock = CLUSTER_6_OAUTH_POLICY_LOCK_V1;

  it("locks Email + gated Google/Apple · Facebook deferred", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.policyLocked).toBe(true);
    expect(lock.publicV1Methods.email).toBe("ENABLED");
    expect(lock.codeReadyUiGated.google.status).toBe("PUBLIC_WHEN_PROVIDER_ENABLED");
    expect(lock.codeReadyUiGated.apple.status).toBe("PUBLIC_WHEN_PROVIDER_ENABLED");
    expect(lock.codeReadyUiGated.google.publicLoginRegisterUi).toBe("GATED_BY_AVAILABILITY");
    expect(lock.codeReadyUiGated.apple.publicLoginRegisterUi).toBe("GATED_BY_AVAILABILITY");
    expect(lock.deferredToV1_1).toContain("Facebook OAuth");
    expect(lock.scopeLocked).toBe(true);
    expect(lock.productionReady).toBe(false);
    assertCluster6OauthPolicyOrBlock();
  });

  it("wires Login / Register OAuth through availability gate only", () => {
    const loginPage = readSource("app/(auth)/login/page.tsx");
    const registerPage = readSource("app/(auth)/register/page.tsx");
    const login = readSource("features/auth/components/LoginScreen.tsx");
    const register = readSource("features/auth/components/RegisterScreen.tsx");

    expect(loginPage).toContain("loadPublicOauthProviders");
    expect(registerPage).toContain("loadPublicOauthProviders");
    expect(login).toContain("AuthOAuthButtons");
    expect(register).toContain("AuthOAuthButtons");
    expect(login).not.toContain("SocialLogin");
    expect(register).not.toContain("SocialLogin");
    expect(login).not.toContain("facebook");
    expect(register).not.toContain("facebook");

    for (const file of [
      "features/auth/components/ForgotPasswordScreen.tsx",
      "features/auth/components/ResetPasswordScreen.tsx",
    ]) {
      const source = readSource(file);
      expect(source, file).not.toContain("AuthOAuthButtons");
      expect(source, file).not.toContain("signInWithOAuthProvider");
    }
  });

  it("gates Verify Email and AuthForm OAuth off by default", () => {
    const verify = readSource("app/(auth)/verify-email/page.tsx");
    expect(verify).toContain("showOAuth={false}");
    expect(verify).not.toContain("showOAuth={true}");

    const form = readSource("features/auth/components/AuthForm.tsx");
    expect(form).toContain("showOAuth = false");
  });

  it("preserves OAuth implementation · callback · fail-closed buttons", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain("signInWithOAuthProvider");
    expect(actions).toContain("signInWithOAuth");
    expect(actions).toContain("oauth_provider_unavailable");

    const callback = readSource("app/auth/callback/route.ts");
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain("syncAutoVerifiedProfile");
    expect(callback).toContain("oauth_cancelled");

    const buttons = readSource("features/auth/components/AuthOAuthButtons.tsx");
    expect(buttons).toContain("providers = []");
    expect(buttons).toContain('provider !== "facebook"');
  });
});
