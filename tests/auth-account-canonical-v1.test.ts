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
    expect(brand).toContain("canonical-rx-3d");
    expect(brand).toContain("OFFICIAL_BRAND_PRIMARY_EMBLEM");
  });

  it("locks register fields without social OAuth UI or GDPR checkbox (AUTH UI v1.2)", () => {
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    const oauth = readSource("features/auth/components/AuthOAuthButtons.tsx");
    const actions = readSource("lib/auth/actions.ts");

    expect(AUTH_MASTER_SPEC.register.copy.title).toBe("Join ROVEXO today 🚀");
    expect(AUTH_MASTER_SPEC.register.copy.submit).toBe("Create Free Account");
    expect(register).toContain('name="fullName"');
    expect(register).toContain('name="confirmPassword"');
    expect(register).toContain('name="terms"');
    expect(register).not.toContain('name="gdpr"');
    expect(register).not.toContain("SocialLogin");
    expect(register).toContain("/legal/terms-and-conditions");
    expect(oauth).toContain("Apple");
    expect(oauth).toContain("Google");
    expect(actions).toContain("signInWithOAuthProvider");
  });

  it("keeps Settings as the only settings entry on the hub menu", () => {
    const sections = buildAccountMenuSections(baseProfile);
    const titles = sections.flatMap((section) => section.items.map((item) => item.title));

    expect(titles).toContain("Settings");
    expect(titles.filter((title) => title === "Settings")).toHaveLength(1);
    expect(sections.flatMap((s) => s.items).find((i) => i.id === "settings")?.href).toBe(
      "/settings",
    );
  });

  it("consolidates Settings inventory under Master Engine lock", () => {
    const settings = readSource("features/account-module/components/SettingsV1.tsx");
    const menu = readSource("lib/account-center/settings-menu.ts");

    expect(settings).toContain("MyAccountTemplate");
    expect(settings).toContain("SettingsMenuSections");
    expect(menu).toContain('"Personal Information"');
    expect(menu).toContain('"Addresses"');
    expect(menu).toContain('"Notifications"');
    expect(menu).not.toContain('title: "Verification"');
    expect(menu).toContain('title: "Payment Methods"');
    expect(menu).not.toContain('title: "Report a Problem"');
    expect(menu).not.toContain('title: "Feedback"');
    expect(menu).not.toContain('"Appearance"');
    expect(menu).toContain("Help Centre");
    expect(settings).not.toContain("SettingsAccordion");
  });

  it("keeps Verification page available without hub menu entry", () => {
    const verification = readSource("app/(platform)/account/verification/page.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");

    expect(verification).toContain("VerificationHubPage");
    expect(menu).not.toContain('title: "Verification"');
    expect(menu).toContain('title: "Settings"');
    expect(menu).not.toContain("Personal Information");
    expect(menu).not.toContain("Address Book");
    expect(menu).not.toContain("Payment Methods");
  });

  it("exposes profile completion redirect SSOT", () => {
    const redirect = buildProfileCompletionRedirect("address", "/checkout/demo-item");
    expect(redirect).toContain("/account/addresses");
    expect(redirect).toContain(`${PROFILE_RETURN_TO_PARAM}=`);
    expect(readSource("lib/profile/auto-verified.ts")).toContain("recalculateRovexoVerified");
    expect(readSource("app/(platform)/auth/callback/route.ts")).toContain("syncAutoVerifiedProfile");
  });

  it("wires checkout publish and withdraw gates", () => {
    expect(readSource("features/checkout/lib/load-checkout-page.ts")).toContain(
      "resolveProfileCompletionRedirect",
    );
    expect(readSource("app/(platform)/wallet/withdraw/page.tsx")).toContain("resolveProfileCompletionRedirect");
    expect(readSource("app/api/account/profile-gate/route.ts")).toContain("resolveProfileCompletionRedirect");
    expect(readSource("features/sell/context/SellProvider.tsx")).toContain("profile-gate");
  });
});
