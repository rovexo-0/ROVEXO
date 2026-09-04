import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase 1 — View Profile opens Public Profile", () => {
  it("loads public profile via store resolve with public profile fallback", () => {
    const page = readSource("app/(platform)/user/[username]/page.tsx");
    expect(page).toContain("resolvePublicProfile");
    expect(page).toContain("getPublicSellerProfile");
    expect(page).toContain("resolveStoreByRouteParam");
    expect(page).toContain("StoreUnavailablePage");
    // Soft enrichment failures must still render ViewProfilePage
    expect(page).toContain('kind: "ok"');
    expect(page).toContain("loadFailed: true");
  });

  it("does not select optional follow counter columns in profile loaders", () => {
    const store = readSource("lib/store/store-repository.ts");
    const publicLoader = readSource("lib/profile/public.ts");
    expect(store).toContain(
      '"id, full_name, username, avatar_url, cover_url, verified, role, created_at, account_status, deleted_at, suspended_at"',
    );
    expect(store).not.toMatch(/PROFILE_SELECT[\s\S]*follower_count/);
    expect(publicLoader).not.toContain("follower_count, following_count");
  });
});
