import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PHASE_C2_CANONICAL_PROFILE_AVATAR_V1 } from "@/lib/profile/phase-c2-canonical-profile-avatar-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase C.2 — Canonical Profile Avatar", () => {
  it("locks SSOT component + camera sheet + pipeline", () => {
    expect(PHASE_C2_CANONICAL_PROFILE_AVATAR_V1.component).toContain("CanonicalProfileAvatar");
    expect(PHASE_C2_CANONICAL_PROFILE_AVATAR_V1.avatarPx).toBe(104);
    expect(PHASE_C2_CANONICAL_PROFILE_AVATAR_V1.cameraButtonPx).toBe(40);
    expect(PHASE_C2_CANONICAL_PROFILE_AVATAR_V1.minHitTargetPx).toBe(44);
    expect(PHASE_C2_CANONICAL_PROFILE_AVATAR_V1.pipeline).toBe("/api/profile/avatar");

    const canonical = readSource("features/profile/components/CanonicalProfileAvatar.tsx");
    expect(canonical).toContain('data-canonical-profile-avatar="v1.0"');
    expect(canonical).toContain('data-profile-avatar-sheet="v1.0"');
    expect(canonical).toContain("Take Photo");
    expect(canonical).toContain("Choose from Gallery");
    expect(canonical).toContain("Remove Photo");
    expect(canonical).toContain('intent="camera"');
    expect(canonical).toContain('intent="gallery"');
    expect(canonical).toContain("/api/profile/avatar");
    expect(canonical).toContain('aria-label={avatarUrl ? "Change profile photo" : "Add profile photo"}');
    expect(existsSync(join(process.cwd(), "styles/rovexo/canonical-profile-avatar-v1.css"))).toBe(
      true,
    );
  });

  it("unifies My Profile · Personal Information · Avatar editor on CanonicalProfileAvatar", () => {
    const myProfile = readSource("features/profile/components/ViewProfilePage.tsx");
    const personalInfo = readSource("features/account/components/ProfileEditPage.tsx");
    const editor = readSource("features/profile/components/ProfileAvatarEditor.tsx");
    const alias = readSource("features/account/components/AvatarUploader.tsx");

    expect(myProfile).toContain("CanonicalProfileAvatar");
    expect(myProfile).toContain("openAvatarSheet");
    expect(myProfile).not.toContain("nativeDirect");
    expect(myProfile).not.toContain("Take Photo");
    expect(myProfile).not.toContain("Choose From Gallery");

    expect(personalInfo).toContain("CanonicalProfileAvatar");
    expect(personalInfo).not.toContain("Take Photo");
    expect(personalInfo).not.toContain("Choose From Gallery");
    expect(personalInfo).not.toContain("Remove Photo");
    expect(personalInfo).not.toContain("Add or change your profile photo.");
    expect(personalInfo).not.toContain("AvatarUploader");
    expect(personalInfo).not.toMatch(/\baccountSettings\b/);

    expect(editor).toContain("CanonicalProfileAvatar");
    expect(editor).not.toMatch(/\baccountSettings\b/);

    expect(alias).toContain("CanonicalProfileAvatar");
    expect(alias).not.toContain("nativeDirect");
    expect(alias).not.toMatch(/\baccountSettings\b/);
  });

  it("does not ship obsolete ProfileAvatarQuickSheet file", () => {
    expect(existsSync(join(process.cwd(), "features/profile/components/ProfileAvatarQuickSheet.tsx"))).toBe(
      false,
    );
  });
});
