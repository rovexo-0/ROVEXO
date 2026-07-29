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

describe("Cluster 6 OAuth Policy Lock", () => {
  const lock = CLUSTER_6_OAUTH_POLICY_LOCK_V1;

  it("locks Email-only public UI · Google/Apple UI-gated · Facebook deferred", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.policyLocked).toBe(true);
    expect(lock.publicV1Methods.email).toBe("ENABLED");
    expect(lock.codeReadyUiGated.google.status).toBe("CODE_READY_UI_GATED");
    expect(lock.codeReadyUiGated.apple.status).toBe("CODE_READY_UI_GATED");
    expect(lock.deferredToV1_1).toContain("Facebook OAuth");
    expect(lock.scopeLocked).toBe(true);
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    assertCluster6OauthPolicyOrBlock();
  });

  it("keeps Login / Register / Forgot / Reset free of OAuth UI", () => {
    for (const file of [
      "features/auth/components/LoginScreen.tsx",
      "features/auth/components/RegisterScreen.tsx",
      "features/auth/components/ForgotPasswordScreen.tsx",
      "features/auth/components/ResetPasswordScreen.tsx",
    ]) {
      const source = readSource(file);
      expect(source, file).not.toContain("SocialLogin");
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

  it("preserves OAuth implementation and callback without public wiring", () => {
    const actions = readSource("lib/auth/actions.ts");
    expect(actions).toContain("signInWithOAuthProvider");
    expect(actions).toContain("signInWithOAuth");

    const callback = readSource("app/auth/callback/route.ts");
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain("syncAutoVerifiedProfile");

    const buttons = readSource("features/auth/components/AuthOAuthButtons.tsx");
    expect(buttons).toContain('providers = ["apple", "google"]');
  });
});
