/**
 * Master Engine — Global Fail Closed registration.
 */

import { registerSmartFeature } from "@/lib/smart-platform/features";
import { FAIL_CLOSED_FEATURE_ID } from "@/lib/fail-closed/constants";
import {
  getFailClosedEngineSnapshot,
  isFailClosedCrashPreventionActive,
  resolveFailClosedState,
  toUserSafeFailClosedMessage,
} from "@/lib/fail-closed/engine";

export function registerFailClosedEngine(): void {
  registerSmartFeature({
    id: FAIL_CLOSED_FEATURE_ID,
    label: "Global Fail Closed",
    // Always available — crash prevention is platform-wide.
    isAvailableInProduction: () => true,
  });
}

export {
  getFailClosedEngineSnapshot,
  isFailClosedCrashPreventionActive,
  resolveFailClosedState,
  toUserSafeFailClosedMessage,
};

registerFailClosedEngine();
