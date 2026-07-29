import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Profile Avatar Native Camera Picker", () => {
  it("opens OS native picker from camera without a custom sheet", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const uploader = readSource("features/account/components/AvatarUploader.tsx");
    expect(page).toContain("AvatarUploader");
    expect(page).toContain("nativeDirect");
    expect(page).toContain(`htmlFor={avatarPickerId}`);
    expect(page).not.toContain("ProfileAvatarQuickSheet");
    expect(page).not.toContain("avatarSheetOpen");
    expect(page).not.toContain('data-profile-avatar-sheet');
    expect(page).not.toContain('router.push("/account/profile/avatar")');
    expect(uploader).toContain('data-avatar-uploader="native-direct"');
    expect(uploader).toContain('intent="gallery"');
    expect(uploader).not.toContain("quickSheet");
    expect(uploader).toContain("/api/profile/avatar");
  });

  it("does not ship ProfileAvatarQuickSheet", () => {
    expect(() =>
      readSource("features/profile/components/ProfileAvatarQuickSheet.tsx"),
    ).toThrow();
  });
});
