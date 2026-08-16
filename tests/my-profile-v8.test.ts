import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("My Profile v8.0 — Share removed · More menu · Bio routes", () => {
  it("keeps Share Profile removed and mounts canonical Share Store", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain('MY_PROFILE_VERSION = "v8.0"');
    expect(page).not.toContain("ShareIcon");
    expect(page).not.toContain("shareProfile");
    expect(page).not.toContain("navigator.share");
    expect(page).not.toContain("Share profile");
    expect(page).not.toContain('aria-label="Share profile"');
    expect(page).toContain("StoreShareSheet");
    expect(page).toContain("STORE_SHARE_COPY.cta");
    expect(page).toContain('title={isOwnProfile ? "My Profile"');
    expect(page).toContain('aria-label="Profile menu"');
  });

  it("PROFILE_MENU_EXISTS=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain('aria-label="Profile menu"');
    expect(page).toContain("vp-v1__menu-btn");
    expect(page).toContain("setMenuOpen");
  });

  it("PROFILE_MENU_SINGLE_INSTANCE=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page.split('aria-label="Profile menu"').length - 1).toBe(1);
    expect(page.split("vp-v1__menu-btn").length - 1).toBe(1);
  });

  it("PROFILE_MENU_ICON=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain('from "lucide-react"');
    expect(page).toContain("<Menu ");
  });

  it("PROFILE_MENU_NOT_VERTICAL_DOTS=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).not.toContain("MoreVertical");
    expect(page).not.toContain("MoreHorizontal");
    expect(page).not.toContain("MoreLineIcon");
  });

  it("PROFILE_MENU_NOT_TEXT_DOTS=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).not.toContain("···");
    expect(page).not.toContain(">...<");
    expect(page).not.toContain(">···<");
    expect(page).not.toContain('aria-label="More"\n                aria-expanded');
  });

  it("PROFILE_MENU_POSITION_TOP_RIGHT=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const heroTop = page.indexOf('className="vp-v1__hero-top"');
    const headerActions = page.indexOf('className="vp-v1__header-actions"');
    const menuBtn = page.indexOf('aria-label="Profile menu"');
    const actions = page.indexOf('className={cn("vp-v1__actions"');
    expect(heroTop).toBeGreaterThan(0);
    expect(headerActions).toBeGreaterThan(heroTop);
    expect(menuBtn).toBeGreaterThan(headerActions);
    expect(actions).toBeGreaterThan(menuBtn);
  });

  it("OLD_MENU_POSITION_REMOVED=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const actionsStart = page.indexOf('className={cn("vp-v1__actions"');
    const actionsEnd = page.indexOf("ProfileCommandCentreButton", actionsStart);
    const actionsBlock = page.slice(actionsStart, actionsEnd);
    expect(actionsBlock).not.toContain("vp-v1__menu-btn");
    expect(actionsBlock).not.toContain('aria-label="Profile menu"');
    expect(actionsBlock).not.toContain("···");
  });

  it("NO_MENU_UNDER_SHARE_STORE=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const shareIdx = page.indexOf("STORE_SHARE_COPY.cta");
    const afterShare = page.slice(shareIdx, shareIdx + 400);
    expect(afterShare).not.toContain("vp-v1__menu-btn");
    expect(afterShare).not.toContain("···");
  });

  it("EXISTING_MENU_ACTIONS_UNCHANGED=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("Copy Profile Link");
    expect(page).toContain("Add / Edit Bio");
    expect(page).toContain("/settings");
    expect(page).toContain("Block User");
    expect(page).toContain("Report User");
    expect(page).toContain("Cancel");
  });

  it("SHARE_STORE_REGRESSION=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("StoreShareSheet");
    expect(page).toContain("STORE_SHARE_COPY.cta");
    expect(page).toContain("vp-v1__action-btn--share");
  });

  it("SUPER_ADMIN_REGRESSION=PASS", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("ProfileCommandCentreButton");
    expect(page).toContain("isOwnProfile && commandCentre");
  });

  it("ships own More menu routes + Copy Profile Link", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(page).toContain("/account/edit-profile");
    expect(page).toContain("CanonicalProfileAvatar");
    expect(page).toContain("openAvatarSheet");
    expect(page).toContain("/account/profile/bio");
    expect(page).toContain("/settings");
    expect(page).toContain("Add / Edit Bio");
    expect(page).toContain("Copy Profile Link");
    expect(page).toContain("Profile link copied.");
    expect(page).toContain("Cancel");
    expect(page).toContain("Follow");
    expect(page).toContain("Message");
    expect(page).toContain("Block User");
    expect(page).toContain("Report User");
  });

  it("opens canonical avatar sheet from camera without page navigation", () => {
    const page = readSource("features/profile/components/ViewProfilePage.tsx");
    const canonical = readSource("features/profile/components/CanonicalProfileAvatar.tsx");
    expect(page).not.toContain('router.push("/account/profile/avatar")');
    expect(page).not.toContain("ProfileAvatarQuickSheet");
    expect(page).toContain("CanonicalProfileAvatar");
    expect(page).toContain("openAvatarSheet");
    expect(page).not.toContain("nativeDirect");
    expect(canonical).toContain('data-avatar-uploader="canonical"');
    expect(canonical).toContain('intent="gallery"');
    expect(canonical).toContain('intent="camera"');
    expect(canonical).toContain("/api/profile/avatar");
  });

  it("ships bio 250 + avatar/bio entry pages", () => {
    const schema = readSource("lib/account/schemas.ts");
    const bioPage = readSource("app/(platform)/account/profile/bio/page.tsx");
    const avatarPage = readSource("app/(platform)/account/profile/avatar/page.tsx");
    const editProfile = readSource("app/(platform)/account/edit-profile/page.tsx");
    const editor = readSource("features/profile/components/ProfileBioEditor.tsx");
    expect(schema).toContain(".max(250");
    expect(editor).toContain("BIO_MAX = 250");
    expect(bioPage).toContain("ProfileBioEditor");
    expect(avatarPage).toContain("ProfileAvatarEditor");
    expect(editProfile).toContain('redirect("/account/profile")');
    expect(readSource("features/profile/components/ViewProfilePage.tsx")).toContain(
      "Add your bio.",
    );
  });
});
