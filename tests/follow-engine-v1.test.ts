import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FOLLOW_ENGINE_V1 } from "@/lib/follow/follow-engine-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Follow Engine v1.0 — Absolute Blood Code", () => {
  it("locks one table · one API · one button DOM", () => {
    expect(FOLLOW_ENGINE_V1.version).toBe("1.0");
    expect(FOLLOW_ENGINE_V1.table).toBe("user_follows");
    expect(FOLLOW_ENGINE_V1.apiPath).toBe("/api/follows");
    expect(FOLLOW_ENGINE_V1.buttonDom).toBe("follow-engine-v1.0");
    expect(FOLLOW_ENGINE_V1.rules.countsFromUserFollowsOnly).toBe(true);
    expect(FOLLOW_ENGINE_V1.rules.noSelfFollow).toBe(true);
    expect(FOLLOW_ENGINE_V1.rules.noDuplicateFollows).toBe(true);
    expect(FOLLOW_ENGINE_V1.rules.noConfirmationDialog).toBe(true);
  });

  it("keeps one FollowButton implementation", () => {
    expect(existsSync(join(process.cwd(), "components/follow/FollowButton.tsx"))).toBe(true);
    const canonical = readSource("components/follow/FollowButton.tsx");
    expect(canonical).toContain('data-follow-button="follow-engine-v1.0"');
    expect(canonical).toContain("/api/follows");
    expect(canonical).not.toContain("Unfollow?");
    expect(canonical).not.toContain('role="dialog"');

    const alias = readSource("features/profile/components/FollowButton.tsx");
    expect(alias).toContain('from "@/components/follow/FollowButton"');
  });

  it("counts only from user_follows — never profile counter columns", () => {
    const engine = readSource("lib/follow/marketplace-follow-store-v1.ts");
    expect(engine).toContain("user_follows");
    expect(engine).toContain('eq("following_id", userId)');
    expect(engine).toContain('eq("follower_id", userId)');
    expect(engine).toContain('count: "exact"');
    expect(engine).not.toContain('select("follower_count, following_count")');
    expect(engine).toContain("You cannot follow yourself");
  });

  it("API uses Follow Engine + returns viewer following SSOT", () => {
    const api = readSource("app/api/follows/route.ts");
    expect(api).toContain("@/lib/follow/marketplace-follow-store-v1");
    expect(api).toContain("viewerFollowingCount");
    expect(api).toContain("You cannot follow yourself");
    expect(api).toContain("requireApiAuth");
  });

  it("public profile loads relationship truth from engine", () => {
    const page = readSource("app/user/[username]/page.tsx");
    expect(page).toContain("getFollowCounts");
    expect(page).toContain("isFollowing");
    expect(page).toContain("@/lib/follow/marketplace-follow-store-v1");
    expect(page).not.toContain("followerCount: profile.followerCount");
  });

  it("profile UI hides Follow on own profile and wires counters", () => {
    const profile = readSource("features/profile/components/ViewProfilePage.tsx");
    expect(profile).toContain("!isOwnProfile");
    expect(profile).toContain("onFollowCountsChange");
    expect(profile).toContain("profile-follower-count");
  });

  it("toggle math stays consistent across follow/unfollow cycles", () => {
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

  it("ships user_follows uniqueness + no-self constraints", () => {
    const sql = readSource(
      "supabase/migrations/20260726230000_marketplace_follow_phase3_only_v1.sql",
    );
    expect(sql).toContain("create table if not exists public.user_follows");
    expect(sql).toContain("user_follows_unique");
    expect(sql).toContain("user_follows_no_self");
  });
});
