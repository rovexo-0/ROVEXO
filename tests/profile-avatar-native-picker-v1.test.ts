import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0 — Profile Avatar Canonical Camera (Phase C.2)", () => {
  it("opens canonical avatar sheet from camera — shared pipeline", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const canonical = readSource("features/profile/components/CanonicalProfileAvatar.tsx");
    expect(page).toContain("CanonicalProfileAvatar");
    expect(page).toContain("openAvatarSheet");
    expect(page).not.toContain('router.push("/account/profile/avatar")');
    expect(page).not.toContain("ProfileAvatarQuickSheet");
    expect(page).not.toContain("nativeDirect");
    expect(canonical).toContain('data-avatar-uploader="canonical"');
    expect(canonical).toContain('data-profile-avatar-sheet="v1.0"');
    expect(canonical).toContain('intent="gallery"');
    expect(canonical).toContain('intent="camera"');
    expect(canonical).toContain("/api/profile/avatar");
  });

  it("does not ship obsolete ProfileAvatarQuickSheet", () => {
    expect(existsSync(join(process.cwd(), "features/profile/components/ProfileAvatarQuickSheet.tsx"))).toBe(
      false,
    );
  });
});
