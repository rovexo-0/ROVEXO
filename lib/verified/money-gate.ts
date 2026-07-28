/**
 * ROVEXO Verified Engine v1.0 — money movement gate.
 * Delegates to Global Smart Platform Smart Money Engine (fail closed when ACTIVE).
 */

import { assertSmartMoneyMovement } from "@/lib/smart-platform/money";
import type { RovexoMoneyGateResult } from "@/lib/verified/types";

/**
 * Assert verification before withdraw / payout money movement.
 * Inactive platform → allow (local / QA / certification).
 * Active platform → fail closed when not ROVEXO VERIFIED.
 */
export async function assertRovexoVerifiedForMoney(userId: string): Promise<RovexoMoneyGateResult> {
  const gate = await assertSmartMoneyMovement(userId);
  return { allowed: gate.allowed, reason: gate.reason };
}
