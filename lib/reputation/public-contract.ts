/**
 * Reputation Engine v1.0 — public field whitelist.
 * Anything not listed here must never appear on buyer-facing surfaces.
 */

export const REPUTATION_PUBLIC_FIELDS = [
  "userId",
  "averageRating",
  "totalReviews",
  "completedOrders",
  "verificationStatus",
  "publicBadges",
  "levelLabel",
] as const;

export type ReputationPublicField = (typeof REPUTATION_PUBLIC_FIELDS)[number];

export type ReputationPublicProfile = {
  userId: string;
  averageRating: number;
  totalReviews: number;
  completedOrders: number;
  verificationStatus: "verified" | "unverified";
  publicBadges: Array<{ id: string; label: string }>;
  /** Public level label only — never the numeric internal score. */
  levelLabel: string;
};

export function assertNoInternalScoreInPublicPayload(
  payload: Record<string, unknown>,
): boolean {
  const forbidden = [
    "score",
    "internalScore",
    "fraudScore",
    "moderationScore",
    "riskScore",
    "componentScores",
    "factorBreakdown",
    "factors",
  ];
  return forbidden.every((key) => !(key in payload));
}
