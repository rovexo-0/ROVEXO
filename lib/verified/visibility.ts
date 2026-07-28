/**
 * ROVEXO Smart Visibility — bridge for Verified Engine consumers.
 * Delegates to Smart Visibility Engine under Master Engine activation.
 */

import {
  resolveSmartVisibility as resolveEngineVisibility,
  type SmartVisibilityState,
} from "@/lib/smart-visibility/engine";
import type { RovexoSmartVisibility } from "@/lib/verified/types";

export function resolveSmartVisibility(input: {
  activeListingCount: number;
  isBusinessVerified: boolean;
  hasPaymentMethod?: boolean;
  isRovexoVerified?: boolean;
  availableBalance?: number;
}): RovexoSmartVisibility {
  const state: SmartVisibilityState = resolveEngineVisibility(input);
  return {
    showHolidayMode: state.showHolidayMode,
    showPromoteListings: state.showPromoteListings,
    showBusinessBankAccount: state.showBusinessBankAccount,
    showPaymentMethods: state.showPaymentMethods,
    showPersonalBankAccount: state.showPersonalBankAccount,
    showWithdraw: state.showWithdraw,
    allowVerifiedBadge: state.allowVerifiedBadge,
    disableWithdrawForZeroBalance: state.disableWithdrawForZeroBalance,
  };
}
