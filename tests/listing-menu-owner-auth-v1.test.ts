import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Listing overflow menu ownership auth (COD SÂNGE)", () => {
  it("ownership decision uses viewerId === product.sellerId only", () => {
    const page = read("features/product-detail/ProductDetailPage.tsx");
    expect(page).toContain("const viewerId = auth?.profile?.id ?? null");
    expect(page).toContain(
      "const isOwnListing = Boolean(viewerId && product.sellerId && viewerId === product.sellerId)",
    );
    expect(page).toContain("isOwner={isOwnListing}");
    expect(page).not.toContain("isOwner={!isOwnListing}");
    expect(page).not.toContain("viewerId !== product.sellerId");
  });

  it("menu polarity is owner→seller actions, else→buyer actions", () => {
    const menu = read("features/product-detail/ProductListingActionsMenu.tsx");
    expect(menu).toContain('data-listing-actions-menu={isOwner ? "seller" : "buyer"}');
    expect(menu).not.toContain('data-listing-actions-menu={isOwner ? "buyer" : "seller"}');
    const ownerBranch = menu.indexOf("{isOwner ? (");
    const edit = menu.indexOf("Edit Listing");
    const report = menu.indexOf("Report Listing");
    expect(ownerBranch).toBeGreaterThan(-1);
    expect(edit).toBeGreaterThan(ownerBranch);
    expect(report).toBeGreaterThan(edit);
  });

  it("AuthProvider invalidates stale profile on auth routes and force-loads after", () => {
    const auth = read("features/auth/providers/AuthProvider.tsx");
    expect(auth).toContain("export function invalidateAuthProfileCache");
    expect(auth).toContain("if (deferProfile)");
    expect(auth).toContain("invalidateAuthProfileCache()");
    expect(auth).toContain("loadProfileOnce(true)");
    expect(auth).toContain("Drop stale viewer identity at auth boundaries");
  });

  it("logout paths clear AuthProvider cache before signOut", () => {
    const profileMenu = read("features/account-center/components/AccountMenuSections.tsx");
    const center = read("features/account-center/components/AccountCenterLogoutButton.tsx");
    const dash = read("features/dashboard/components/LogoutButton.tsx");
    for (const src of [profileMenu, center, dash]) {
      expect(src).toContain("invalidateAuthProfileCache");
      expect(src).toContain("signOut");
    }
  });
});
