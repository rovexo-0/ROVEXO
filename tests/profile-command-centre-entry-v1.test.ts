import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveProfileCommandCentreEntry,
  PROFILE_COMMAND_CENTRE_ENTRY_V1,
} from "@/lib/profile/command-centre-entry-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Profile Command Centre entry RC1", () => {
  it("locks SSOT id and role matrix", () => {
    expect(PROFILE_COMMAND_CENTRE_ENTRY_V1.id).toBe("profile-command-centre-entry-v1");
    expect(PROFILE_COMMAND_CENTRE_ENTRY_V1.version).toBe("1.0.0");
  });

  it("hides for guests · buyers · sellers · business · non-own profiles", () => {
    expect(
      resolveProfileCommandCentreEntry({ isOwnProfile: false, role: "super_admin" }),
    ).toBeNull();
    expect(resolveProfileCommandCentreEntry({ isOwnProfile: true, role: null })).toBeNull();
    expect(resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "buyer" })).toBeNull();
    expect(resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "seller" })).toBeNull();
    expect(resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "business" })).toBeNull();
  });

  it("shows Super Admin CTA only for SUPER_ADMIN own profile", () => {
    const entry = resolveProfileCommandCentreEntry({
      isOwnProfile: true,
      role: "super_admin",
    });
    expect(entry).toEqual({
      kind: "super_admin",
      href: "/super-admin",
      label: "Super Admin Command Centre",
      badge: "SUPER ADMIN",
      ariaLabel: "Open Super Admin Command Centre",
    });
  });

  it("shows Admin CTA only for ADMIN own profile (not Super Admin)", () => {
    const entry = resolveProfileCommandCentreEntry({
      isOwnProfile: true,
      role: "admin",
    });
    expect(entry).toEqual({
      kind: "admin",
      href: "/admin",
      label: "Admin Command Centre",
      badge: "ADMIN",
      ariaLabel: "Open Admin Command Centre",
    });
  });

  it("wires My Profile · middleware · layouts without CSS hide hacks", () => {
    const page = readSource("app/(platform)/user/[username]/page.tsx");
    const view = readSource("features/profile/components/ViewProfilePage.tsx");
    const button = readSource("features/profile/components/ProfileCommandCentreButton.tsx");
    const css = readSource("styles/rovexo/view-profile-v1.css");
    const middleware = readSource("lib/supabase/middleware.ts");
    const adminLayout = readSource("app/(platform)/admin/layout.tsx");
    const superLayout = readSource("app/(platform)/super-admin/layout.tsx");

    expect(page).toContain("resolveProfileCommandCentreEntry");
    expect(page).toContain("commandCentre=");
    expect(view).toContain("ProfileCommandCentreButton");
    expect(view).toContain("isOwnProfile && commandCentre");
    expect(view).not.toContain("display:none");
    expect(view).not.toContain("visibility:hidden");
    expect(button).toContain('href={entry.href}');
    expect(button).toContain("aria-label={entry.ariaLabel}");
    expect(button).not.toContain("Full platform control");
    expect(css).toContain(".vp-v1__command-centre-btn");
    expect(css).toContain("border-radius: 14px");
    expect(middleware).toContain("AUTH_ADMIN_PREFIXES");
    expect(middleware).toContain("isAdminPage");
    expect(adminLayout).toContain('requireRole(["admin", "super_admin"])');
    expect(superLayout).toContain('requireRole(["super_admin"])');
  });

  it("maps Owner RC1 administrator accounts to correct CTAs", () => {
    expect(
      resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "super_admin" })?.href,
    ).toBe("/super-admin");
    expect(
      resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "admin" })?.href,
    ).toBe("/admin");
    expect(
      resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "super_admin" })?.label,
    ).toBe("Super Admin Command Centre");
    expect(
      resolveProfileCommandCentreEntry({ isOwnProfile: true, role: "admin" })?.label,
    ).toBe("Admin Command Centre");
  });
});
