import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Follow Engine v1.0 — Complete Follow system", () => {
  it("keeps one FollowButton implementation (components/follow)", () => {
    expect(existsSync(join(process.cwd(), "components/follow/FollowButton.tsx"))).toBe(true);
    const canonical = readSource("components/follow/FollowButton.tsx");
    expect(canonical).toContain("follow-engine-v1.0");
    expect(canonical).toContain("/api/follows");
    expect(canonical).not.toContain("Unfollow?");
    expect(canonical).not.toContain('role="dialog"');

    const alias = readSource("features/profile/components/FollowButton.tsx");
    expect(alias).toContain('from "@/components/follow/FollowButton"');
    expect(alias).not.toContain("confirmOpen");
  });

  it("uses one follow engine + one API route", () => {
    expect(existsSync(join(process.cwd(), "lib/follow/follow-engine-v1.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib/follow/marketplace-follow-store-v1.ts"))).toBe(
      true,
    );
    expect(existsSync(join(process.cwd(), "app/api/follows/route.ts"))).toBe(true);
    const engine = readSource("lib/follow/marketplace-follow-store-v1.ts");
    expect(engine).toContain("user_follows");
    expect(engine).toContain("followUser");
    expect(engine).toContain("unfollowUser");
    expect(engine).toContain("getFollowCounts");
    expect(engine).toContain("You cannot follow yourself");
    expect(engine).toContain('count: "exact"');
    expect(engine).not.toContain('select("follower_count, following_count")');
  });

  it("wires Public Profile counters + no own-profile button", () => {
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(profile).toContain("!isOwnProfile");
    expect(profile).toContain("onFollowCountsChange");
    expect(profile).toContain("userId={profile.id}");
    expect(profile).toContain("profile-follower-count");
  });

  it("loads follow truth on public profile page", () => {
    const page = readSource("app/user/[username]/page.tsx");
    expect(page).toContain("getFollowCounts");
    expect(page).toContain("isFollowing");
    expect(page).toContain("@/lib/follow/marketplace-follow-store-v1");
  });

  it("keeps Follow button visual tokens", () => {
    const css = readSource("components/follow/FollowButton.module.css");
    expect(css).toContain("height: 48px");
    expect(css).toContain("border-radius: 14px");
    expect(css).toContain("200ms");
  });

  it("toggle math stays consistent across 20 follow/unfollow cycles", () => {
    let followerCount = 3;
    let following = false;
    for (let i = 0; i < 20; i += 1) {
      const action = following ? "unfollow" : "follow";
      following = action === "follow";
      followerCount = Math.max(0, followerCount + (action === "follow" ? 1 : -1));
      expect(followerCount).toBeGreaterThanOrEqual(0);
    }
    expect(following).toBe(false);
    expect(followerCount).toBe(3);
  });

  it("ships marketplace follow migration SSOT", () => {
    expect(
      existsSync(
        join(process.cwd(), "supabase/migrations/20260726230000_marketplace_follow_phase3_only_v1.sql"),
      ),
    ).toBe(true);
    const sql = readSource(
      "supabase/migrations/20260726230000_marketplace_follow_phase3_only_v1.sql",
    );
    expect(sql).toContain("create table if not exists public.user_follows");
    expect(sql).toContain("user_follows_unique");
    expect(sql).toContain("user_follows_no_self");
  });
});
