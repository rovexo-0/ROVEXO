import "server-only";

/**
 * HMRC threshold warning notifications — idempotent per seller / tax year / percent.
 * Respects notification_preferences via emitSmartNotification.
 */

import { emitSmartNotification } from "@/lib/notifications/events";
import {
  formatGbp,
  resolveCrossedWarningPercents,
  type HmrcEngineConfig,
  type HmrcSellerCounters,
} from "@/lib/compliance/hmrc-engine-v1";

export type HmrcThresholdWarningResult = {
  attempted: number;
  emitted: number;
  skipped: number;
};

export { resolveCrossedWarningPercents };

export async function emitHmrcThresholdWarnings(input: {
  userId: string;
  counters: HmrcSellerCounters;
  config: HmrcEngineConfig;
}): Promise<HmrcThresholdWarningResult> {
  if (!input.config.reportingRules.notifyOnWarningPercents) {
    return { attempted: 0, emitted: 0, skipped: 0 };
  }

  const crossed = resolveCrossedWarningPercents(
    input.counters.percentage,
    input.config.warningPercents,
  );

  let emitted = 0;
  let skipped = 0;

  for (const percent of crossed) {
    const idempotencyKey = `hmrc-threshold-${input.userId}-${input.counters.currentTaxYear}-${percent}`;
    const ok = await emitSmartNotification({
      userId: input.userId,
      eventType: "policy_update",
      idempotencyKey,
      notificationType: "system",
      title: `HMRC threshold ${percent}%`,
      subtitle: `Your sales are at ${input.counters.percentage}% of the ${formatGbp(input.counters.threshold)} reporting threshold (${formatGbp(input.counters.grossSales)}).`,
      href: "/seller/compliance",
      payload: {
        kind: "hmrc_threshold_warning",
        percent,
        taxYear: input.counters.currentTaxYear,
        grossSales: input.counters.grossSales,
        threshold: input.counters.threshold,
      },
    });
    if (ok) emitted += 1;
    else skipped += 1;
  }

  if (input.counters.reportRequired && input.config.reportingRules.reportWhenAtOrAboveThreshold) {
    const idempotencyKey = `hmrc-required-${input.userId}-${input.counters.currentTaxYear}`;
    const ok = await emitSmartNotification({
      userId: input.userId,
      eventType: "policy_update",
      idempotencyKey,
      notificationType: "system",
      title: "HMRC reporting required",
      subtitle: `Your sales have reached the ${formatGbp(input.counters.threshold)} reporting threshold. Review your HMRC Reporting Centre.`,
      href: "/seller/compliance",
      payload: {
        kind: "hmrc_reporting_required",
        taxYear: input.counters.currentTaxYear,
      },
    });
    if (ok) emitted += 1;
    else skipped += 1;
  }

  return { attempted: crossed.length + (input.counters.reportRequired ? 1 : 0), emitted, skipped };
}
