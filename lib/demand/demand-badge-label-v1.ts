/**
 * Demand Engine V1.0 → ListingCard copy mapper.
 * Does not calculate demand. UNKNOWN / NOT_IN_DEMAND → no badge.
 */

import type { DemandEngineResult } from "@/lib/demand/demand-engine-v1";

export function demandBadgeLabelFromResult(
  result: DemandEngineResult,
): string | null {
  if (result.state !== "IN_DEMAND" || result.badge == null) {
    return null;
  }
  return result.badge.card;
}
