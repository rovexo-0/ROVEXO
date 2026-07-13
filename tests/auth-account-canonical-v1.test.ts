import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAccountMenuSections } from "@/lib/account-center/canonical-menu";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities } from "@/lib/profile/unified-account";
import type { UserProfile } from "@/lib/profile/types";
import {
  buildProfileCompletionRedirect,
  PROFILE_RETURN_TO_PARAM,
} from "@/lib/account/profile-completion";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const baseProfile: UserProfile = {
  id: "user-1",
  fullName: "Mihai Palade",
  username: "mihai",
  email: "mihai@example.com",
  verified: true,
  memberSince: "2026-01-01",
  role: "buyer",
  accountKind: ROVEXO_ACCOUNT_KIND,
  accountType: ROVEXO_ACCOUNT_KIND,
  capabilities: resolveAccountCapabilities({
    role: "buyer",
    verified: true,
    hasSellerProfile: false,
    hasBusinessAccount: false,
  }),
  isSeller: false,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

describe("Auth + Account Architecture canonical v1.0", () => {
  it("locks premium auth shell and login copy", () => {
    const shell = readSource("features/auth/components/AuthShell.tsx");
    const login = readSource("features/auth/components/LoginScreen.tsx");
    const brand = readSource("components/branding/RovexoBrandLogo.tsx");

    expect(shell).toContain("bg-white");
    expect(login).toContain("AUTH_MASTER_SPEC.login");
    expect(AUTH_MASTER_SPEC.login.copy.title).toBe("Welcome back 👋");
    expect(AUTH_MASTER_SPEC.login.copy.createAccount).toBe("Create Free Account");
    expect(AUTH_MASTER_SPEC.login.copy.forgotPassword).toBe("Forgot Password");
    expect(brand).toContain("BUY.");
  });

  it("locks register fields and OAuth entry points", () => {
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    const oauth = readSource("features/auth/components/AuthOAuthButtons.tsx");
    const actions = readSource("lib/auth/actions.ts");

    expect(AUTH_MASTER_SPEC.register.copy.title).toBe("Join ROVEXO today 🚀");
    expect(AUTH_MASTER_SPEC.register.copy.submit).toBe("Create Free Account");
    expect(register).toContain('name="fullName"');
    expect(register).toContain('name="confirmPassword"');
    expect(register).toContain('name="terms"');
    expect(register).toContain('name="gdpr"');
    expect(register).toContain("/legal/cookie-policy");
    expect(oauth).toContain("Apple");
    expect(oauth).toContain("Google");
    expect(actions).toContain("signInWithOAuthProvider");
  });

  it("keeps ACCOUNT section to Settings and Promotion Tools", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const account = sections.find((section) => section.id === "account");

    expect(account?.items.map((item) => item.title)).toEqual(["Settings", "Promotion Tools"]);
    expect(account?.items[0]?.href).toBe("/account/settings");
    expect(account?.items[1]?.href).toBe("/account/promotion-tools");
  });

  it("consolidates account features under Settings", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");

    expect(settings).toContain("AccountCanonicalShell");
    expect(settings).toContain("SettingsAccordion");
    expect(settings).toContain('"Profile"');
    expect(settings).toContain('"Addresses"');
    expect(settings).toContain('"Payment Methods"');
    expect(settings).toContain('"Bank Account"');
    expect(settings).toContain("Notification Preferences");
    expect(settings).toContain("DeleteAccountFlow");
    expect(settings).not.toContain("Help Centre");
    expect(settings).not.toContain("Appearance");
  });

  it("removes manual verification route UI", () => {
    const verification = readSource("app/account/verification/page.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");

    expect(verification).toContain('redirect("/account/settings")');
    expect(menu).not.toContain("Verification");
    expect(menu).not.toContain("Personal Information");
    expect(menu).not.toContain("Address Book");
    expect(menu).not.toContain("Payment Methods");
  });

  it("exposes profile completion redirect SSOT", () => {
    const redirect = buildProfileCompletionRedirect("address", "/checkout/demo-item");
    expect(redirect).toContain("/account/addresses");
    expect(redirect).toContain(`${PROFILE_RETURN_TO_PARAM}=`);
    expect(readSource("lib/profile/auto-verified.ts")).toContain("showVerifiedBadge");
    expect(readSource("app/auth/callback/route.ts")).toContain("syncAutoVerifiedProfile");
  });

  it("wires checkout publish and withdraw gates", () => {
    expect(readSource("app/checkout/[slug]/page.tsx")).toContain("resolveProfileCompletionRedirect");
    expect(readSource("app/wallet/withdraw/page.tsx")).toContain("resolveProfileCompletionRedirect");
    expect(readSource("app/api/account/profile-gate/route.ts")).toContain("resolveProfileCompletionRedirect");
    expect(readSource("features/sell/context/SellProvider.tsx")).toContain("profile-gate");
  });
});
