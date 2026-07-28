/**
 * ROVEXO FOLLOW ENGINE v1.0 — ABSOLUTE BLOOD CODE (lock SSOT)
 *
 * ONE table: public.user_follows (follower_id → following_id)
 * ONE implementation: lib/follow/marketplace-follow-store-v1.ts
 * ONE API: POST/GET /api/follows
 * ONE button: components/follow/FollowButton.tsx
 *
 * Counters originate ONLY from user_follows row counts.
 * Never reverse: Followers = following_id · Following = follower_id
 */

export const FOLLOW_ENGINE_V1 = {
  version: "1.0",
  table: "user_follows",
  apiPath: "/api/follows",
  implementation: "lib/follow/marketplace-follow-store-v1.ts",
  buttonDom: "follow-engine-v1.0",
  rules: {
    oneRelationshipRecord: true,
    noDuplicateFollows: true,
    noSelfFollow: true,
    requireAuthenticatedUser: true,
    optimisticUi: true,
    rollbackOnFailure: true,
    noConfirmationDialog: true,
    countsFromUserFollowsOnly: true,
  },
} as const;
