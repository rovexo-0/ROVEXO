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
    const login = readSource("app/(auth)/login/page.tsx");
    const brand = readSource("features/auth/components/AuthBrand.tsx");

    expect(shell).toContain("bg-white");
    expect(login).toContain("Welcome back 👋");
    expect(login).toContain("Create Free Account");
    expect(login).toContain("Forgot Password");
    expect(brand).toContain("Buy. Sell. Grow.");
  });

  it("locks register fields and OAuth entry points", () => {
    const register = readSource("app/(auth)/register/page.tsx");
    const fields = readSource("features/auth/components/RegisterFields.tsx");
    const oauth = readSource("features/auth/components/AuthOAuthButtons.tsx");
    const actions = readSource("lib/auth/actions.ts");

    expect(register).toContain("Join ROVEXO today 🚀");
    expect(register).toContain("Create Free Account");
    expect(fields).toContain('name="firstName"');
    expect(fields).toContain('name="lastName"');
    expect(fields).toContain('name="confirmPassword"');
    expect(fields).toContain('name="terms"');
    expect(fields).toContain('name="gdpr"');
    expect(fields).toContain("/legal/cookie-policy");
    expect(oauth).toContain("Apple");
    expect(oauth).toContain("Google");
    expect(actions).toContain("signInWithOAuthProvider");
  });

  it("keeps ACCOUNT section to Settings only", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const account = sections.find((section) => section.id === "account");

    expect(account?.items.map((item) => item.title)).toEqual(["Settings"]);
    expect(account?.items[0]?.href).toBe("/account/settings");
  });

  it("consolidates account features under Settings", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");

    expect(settings).toContain('data-settings-version="v1.0-production"');
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
