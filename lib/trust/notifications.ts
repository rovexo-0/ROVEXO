import { emitSmartNotification } from "@/lib/notifications/events";
import { TRUST_TIER_LABELS } from "@/lib/trust/constants";
import type { TrustTier } from "@/lib/trust/types";

export async function notifyTrustScoreChange(input: {
  userId: string;
  scoreBefore: number;
  scoreAfter: number;
  tier: TrustTier;
  reason: string;
  improvementTip?: string;
}): Promise<void> {
  const delta = input.scoreAfter - input.scoreBefore;
  if (delta === 0) return;

  const direction = delta > 0 ? "increased" : "decreased";
  const memberLabel = `${TRUST_TIER_LABELS[input.tier]} Member`;
  const subtitle = `Your trust score ${direction} to ${input.scoreAfter} (${TRUST_TIER_LABELS[input.tier]}). ${input.reason}`;

  await emitSmartNotification({
    userId: input.userId,
    eventType: "trust_verification",
    idempotencyKey: `trust-score-${input.userId}-${input.scoreBefore}-${input.scoreAfter}`,
    notificationType: "system",
    title: delta > 0 ? "Trust score improved" : "Trust score updated",
    subtitle,
    detail: memberLabel,
    href: "/trust",
    payload: {
      scoreBefore: input.scoreBefore,
      scoreAfter: input.scoreAfter,
      tier: input.tier,
      reason: input.reason,
    },
  });
}
